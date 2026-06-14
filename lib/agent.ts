import {
  GoogleGenAI,
  Type,
  type Content,
  type FunctionDeclaration,
  type Part,
} from '@google/genai';
import type { FeatureCollection } from 'geojson';
import { queryCadastre } from './cadastre';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `You are a NSW land-parcel assistant. You can only answer using the \`query_cadastre\` tool, which returns official NSW cadastral lot data. Always ground answers in returned parcel IDs (lotidstring). If a request needs data this tool doesn't have (addresses, suburbs, ownership, zoning, flood), say so plainly. Never invent parcels.

The tool takes an ArcGIS SQL "where" clause that you build from the user's plain English. Available fields: lotidstring (e.g. '1//DP270928'), plannumber (integer, e.g. 270928), planlabel, planlotarea (number, square metres). Examples:
- exact lot: lotidstring = '1//DP270928'
- by plan number: plannumber = 270928
- by area: planlotarea > 600
- everything (testing only): 1=1

After the tool returns, give a concise natural-language answer that cites the relevant lotidstring values. If zero parcels matched, say so plainly.`;

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface AgentResult {
  reply: string;
  geojson: FeatureCollection | null;
  feature_count: number;
}

const queryCadastreDeclaration: FunctionDeclaration = {
  name: 'query_cadastre',
  description:
    'Query the live NSW Cadastre for land-parcel (lot) polygons. Returns official lot data with geometry. Use for any question about specific lots, plans, or parcel sizes.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      where: {
        type: Type.STRING,
        description:
          "ArcGIS SQL where clause translated from the user's request. Fields: lotidstring, plannumber, planlabel, planlotarea. E.g. \"lotidstring = '1//DP270928'\", \"plannumber = 270928\", \"planlotarea > 600\".",
      },
      max_features: {
        type: Type.INTEGER,
        description: 'Maximum parcels to return. Default 200, hard cap 500.',
      },
    },
    required: ['where'],
  },
};

function getClient(): GoogleGenAI {
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION,
  });
}

/**
 * Run a single function-calling round-trip:
 *   user message -> model -> (optional) query_cadastre -> model -> final reply.
 */
export async function runAgent(
  message: string,
  history: ChatHistoryItem[] = [],
): Promise<AgentResult> {
  const ai = getClient();

  const contents: Content[] = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const config = {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: [queryCadastreDeclaration] }],
  };

  const first = await ai.models.generateContent({ model: MODEL, contents, config });

  const calls = first.functionCalls ?? [];
  if (calls.length === 0) {
    // Model chose not to call the tool (e.g. an out-of-scope request it declines).
    return { reply: first.text ?? '', geojson: null, feature_count: 0 };
  }

  // v1: single tool, single round-trip. Honour the first query_cadastre call.
  const call = calls[0];
  const args = (call.args ?? {}) as { where?: string; max_features?: number };
  const where = args.where ?? '1=1';

  const { geojson, feature_count } = await queryCadastre(where, args.max_features ?? 200);

  // Send the tool result back to the model for a grounded reply.
  const modelTurn: Content = {
    role: 'model',
    parts: (first.candidates?.[0]?.content?.parts as Part[]) ?? [
      { functionCall: { name: call.name, args: call.args } },
    ],
  };

  const toolTurn: Content = {
    role: 'user',
    parts: [
      {
        functionResponse: {
          name: call.name ?? 'query_cadastre',
          response: {
            feature_count,
            parcels: geojson.features.map((f) => f.properties),
          },
        },
      },
    ],
  };

  const second = await ai.models.generateContent({
    model: MODEL,
    contents: [...contents, modelTurn, toolTurn],
    config,
  });

  return {
    reply: second.text ?? '',
    geojson,
    feature_count,
  };
}
