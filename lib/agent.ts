import { GoogleGenAI, Type, type Content, type FunctionDeclaration } from '@google/genai';
import type { FeatureCollection } from 'geojson';
import type { SourceResult, ParcelRef } from '@/types/nsw';
import { parcelByWhere, geocodeAddress } from './sources/cadastre';
import { fsrAtPoint, heightAtPoint, lotSizeAtPoint, heritageAtPoint } from './sources/planning';
import { wikipediaLookup } from './sources/wikipedia';
import { LAYER_REGISTRY } from './layers';
import type { LayerName } from '@/types/nsw';

const PT = { type: Type.OBJECT, properties: { lng: { type: Type.NUMBER }, lat: { type: Type.NUMBER } }, required: ['lng','lat'] };

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  { name: 'geocode_address', description: 'Resolve a NSW street address to matching properties (point/parcel).',
    parameters: { type: Type.OBJECT, properties: { address: { type: Type.STRING } }, required: ['address'] } },
  { name: 'query_parcel', description: "Cadastral lots by ArcGIS SQL where clause. Fields: lotidstring (string, format 'LOT//PLAN' e.g. '1//DP270928', or 'LOT/SECTION/PLAN'), plannumber (integer e.g. 270928), planlotarea (number, square metres). Examples: \"lotidstring = '1//DP270928'\"; \"plannumber = 270928\"; \"planlotarea > 600\".",
    parameters: { type: Type.OBJECT, properties: { where: { type: Type.STRING }, max_features: { type: Type.INTEGER } }, required: ['where'] } },
  { name: 'query_zoning',   description: 'Land-use zoning at a point.', parameters: PT },
  { name: 'query_fsr',      description: 'Floor space ratio at a point.', parameters: PT },
  { name: 'query_height',   description: 'Max building height control at a point.', parameters: PT },
  { name: 'query_lotsize',  description: 'Minimum lot size control at a point.', parameters: PT },
  { name: 'query_heritage', description: 'Heritage listing at a point.', parameters: PT },
  { name: 'query_bushfire', description: 'Bush fire prone land category at a point.', parameters: PT },
  { name: 'query_flood',    description: 'Whether a point intersects known flood extents.', parameters: PT },
  { name: 'query_suburb',   description: 'Suburb / LGA at a point.', parameters: PT },
  { name: 'wikipedia_lookup', description: 'General-knowledge summary (NOT NSW cadastre data).',
    parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ['query'] } },
];

const pt = (f: (lng: number, lat: number) => Promise<SourceResult>) => (a: any) => f(a.lng, a.lat);
// The five map-layer tools call the SAME per-layer function the /api/layer proxy
// (and the click-to-load path) use — one source of truth via LAYER_REGISTRY.
const layer = (name: LayerName) => (a: any) => LAYER_REGISTRY[name](a.lng, a.lat);

const HANDLERS: Record<string, (args: any) => Promise<unknown>> = {
  geocode_address: (a) => geocodeAddress(a.address),
  query_parcel: (a) => parcelByWhere(a.where, a.max_features ?? 200),
  query_zoning: layer('zoning'),
  query_fsr: pt(fsrAtPoint),
  query_height: pt(heightAtPoint),
  query_lotsize: pt(lotSizeAtPoint),
  query_heritage: pt(heritageAtPoint),
  query_bushfire: layer('bushfire'),
  query_flood: layer('flood'),
  query_suburb: layer('suburbs'),
  wikipedia_lookup: (a) => wikipediaLookup(a.query),
};

// Only tools with a corresponding map LayerName are drawn. fsr/height/lotsize/heritage
// return geometry too but are reported in text only (no toggle layer in v1, by design).
export const TOOL_TO_LAYER: Record<string, string> = {
  query_parcel: 'parcels', query_zoning: 'zoning', query_bushfire: 'bushfire', query_flood: 'flood', query_suburb: 'suburbs',
};

export async function dispatchTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const h = HANDLERS[name];
  if (!h) throw new Error(`Unknown tool: ${name}`);
  return h(args);
}

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const MAX_STEPS = 4;

const SYSTEM = `You are a NSW place analyser. Use the tools to answer with official NSW data, grounding answers in returned parcel IDs (lotidstring), zone classes, etc. When the user has selected a parcel, treat "this/here" as that parcel. For full "tell me everything" requests, call the relevant spatial tools in parallel. Planning/hazard data is indicative, not legal advice — say so. Ownership and valuation are not available; say so plainly. For general-knowledge or out-of-NSW questions use wikipedia_lookup and clearly note it is general knowledge, not NSW cadastre data. Never invent parcels.`;

export interface AgentResult { reply: string; layers: Record<string, FeatureCollection>; feature_count: number }

export async function runAgentWithClient(ai: GoogleGenAI, message: string, history: { role: 'user'|'model'; text: string }[], selectedParcel: ParcelRef | null): Promise<AgentResult> {
  const ctx = selectedParcel
    ? `\n\n[Selected parcel: ${selectedParcel.lotidstring}${
        selectedParcel.address ? ` — ${selectedParcel.address}` : ''
      }${
        selectedParcel.point
          ? ` at lng=${selectedParcel.point.lng}, lat=${selectedParcel.point.lat} — use these coordinates for point-based tools (zoning, bushfire, flood, suburb)`
          : ''
      }]`
    : '';
  const contents: Content[] = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: message + ctx }] },
  ];
  const config = { systemInstruction: SYSTEM, tools: [{ functionDeclarations: TOOL_DECLARATIONS }] };
  const layers: Record<string, FeatureCollection> = {};
  let feature_count = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    const resp = await ai.models.generateContent({ model: MODEL, contents, config });
    const calls = resp.functionCalls ?? [];
    if (calls.length === 0) return { reply: resp.text ?? '', layers, feature_count };

    contents.push({ role: 'model', parts: (resp.candidates?.[0]?.content?.parts as any) ?? calls.map((c) => ({ functionCall: { name: c.name, args: c.args } })) });

    const results = await Promise.all(calls.map(async (c) => {
      try {
        const out: any = await dispatchTool(c.name!, (c.args ?? {}) as any);
        if (out?.geojson && TOOL_TO_LAYER[c.name!]) { layers[TOOL_TO_LAYER[c.name!]] = out.geojson; feature_count += out.feature_count ?? 0; }
        const payload = out?.summary ?? out;
        return { name: c.name!, response: { result: payload } };
      } catch (err) {
        return { name: c.name!, response: { error: err instanceof Error ? err.message : 'tool failed' } };
      }
    }));
    contents.push({ role: 'user', parts: results.map((r) => ({ functionResponse: r })) });
  }
  const final = await ai.models.generateContent({ model: MODEL, contents, config: { systemInstruction: SYSTEM } });
  return { reply: final.text ?? '', layers, feature_count };
}

export function runAgent(message: string, history: { role: 'user'|'model'; text: string }[] = [], selectedParcel: ParcelRef | null = null): Promise<AgentResult> {
  const ai = new GoogleGenAI({ vertexai: true, project: process.env.GOOGLE_CLOUD_PROJECT, location: process.env.GOOGLE_CLOUD_LOCATION });
  return runAgentWithClient(ai, message, history, selectedParcel);
}
