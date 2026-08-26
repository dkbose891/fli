import { GoogleGenAI, Type, type Content, type FunctionDeclaration } from '@google/genai';
import type { FeatureCollection } from 'geojson';
import type { SourceResult, ParcelRef } from '@/types/nsw';
import { parcelByWhere, parcelAtPoint, propertyAtPoint, geocodeAddress } from './sources/cadastre';
import { fsrAtPoint, heightAtPoint, lotSizeAtPoint, heritageAtPoint } from './sources/planning';
import { builtCharacterAtPoint, specialCharacterAtPoint, nativeVegetationAtPoint } from './sources/provisions';
import { landslideAtPoint, historicFireAtPoint, airportNoiseAtPoint } from './sources/hazard';
import { easementsAtPoint } from './sources/easements';
import { roadHierarchyAtPoint } from './sources/transport';
import { electricityAtPoint } from './sources/electricity';
import { parksNear } from './sources/poi';
import { landValueByPropid, recentSalesNear } from './sources/valuation';
import { catchmentsAtPoint } from './sources/education';
import { dasNear } from './sources/da';
import { developmentPotential, parseBand } from './potential';
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
  { name: 'query_easements', description: 'Digitised easements on the lot at a point (easementtype, easementwidth). Cadastre polygons only — not a title search; non-digitised easements may be missing.', parameters: PT },
  { name: 'query_built_character', description: 'Built Character Map overlay at a point (ePlanning Local Provisions).', parameters: PT },
  { name: 'query_special_character', description: 'Special Character Areas Map overlay at a point.', parameters: PT },
  { name: 'query_native_vegetation', description: 'Significant Native Vegetation Map overlay at a point.', parameters: PT },
  { name: 'query_landslide', description: 'Landslide Risk Land overlay at a point.', parameters: PT },
  { name: 'query_historic_fire', description: 'Whether a point intersects a historic bushfire footprint (NSW RFS fire history).', parameters: PT },
  { name: 'query_road_hierarchy', description: 'Nearest road function hierarchy classes within 200 m (Motorway, Arterial, Local, etc.).',
    parameters: { type: Type.OBJECT, properties: { lng: { type: Type.NUMBER }, lat: { type: Type.NUMBER }, radius_m: { type: Type.INTEGER } }, required: ['lng','lat'] } },
  { name: 'query_electricity', description: 'Electricity DNSP (Essential Energy / Ausgrid / Endeavour) and nearby open-data distribution assets. Indicative only — not a before-you-dig authority.',
    parameters: { type: Type.OBJECT, properties: { lng: { type: Type.NUMBER }, lat: { type: Type.NUMBER }, radius_m: { type: Type.INTEGER } }, required: ['lng','lat'] } },
  { name: 'query_parks_nearby', description: 'Parks, reserves and recreation POI within radius (default 500 m).',
    parameters: { type: Type.OBJECT, properties: { lng: { type: Type.NUMBER }, lat: { type: Type.NUMBER }, radius_m: { type: Type.INTEGER } }, required: ['lng','lat'] } },
  { name: 'query_airport_noise', description: 'Aircraft noise ANEF planning contour at a point (EPI Airport Noise). ANEF land-use contour — not flights-per-day frequency.', parameters: PT },
  { name: 'query_suburb',   description: 'Suburb / LGA at a point.', parameters: PT },
  { name: 'query_land_value', description: 'Valuer General land value history (5 years) for the property at a point. Unimproved LAND value — not a market/sale price; say so.', parameters: PT },
  { name: 'query_recent_sales', description: 'Most recent property sales near a point (price, date, address, lot size), default 500 m radius.',
    parameters: { type: Type.OBJECT, properties: { lng: { type: Type.NUMBER }, lat: { type: Type.NUMBER }, radius_m: { type: Type.INTEGER } }, required: ['lng','lat'] } },
  { name: 'query_school_catchment', description: 'NSW public school catchments (primary + secondary) containing a point.', parameters: PT },
  { name: 'query_das_nearby', description: 'Development applications near a point (status, type, cost, address), default 1000 m radius. Data lags in some council areas — report the _coverage note.',
    parameters: { type: Type.OBJECT, properties: { lng: { type: Type.NUMBER }, lat: { type: Type.NUMBER }, radius_m: { type: Type.INTEGER } }, required: ['lng','lat'] } },
  { name: 'query_development_potential', description: 'Indicative development potential at a point: max GFA range (FSR band × lot area), storey estimate from height control, subdivision hint vs minimum lot size. Arithmetic on mapped controls — always caveat that it is not planning advice.', parameters: PT },
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
  query_easements: pt(easementsAtPoint),
  query_built_character: pt(builtCharacterAtPoint),
  query_special_character: pt(specialCharacterAtPoint),
  query_native_vegetation: pt(nativeVegetationAtPoint),
  query_landslide: pt(landslideAtPoint),
  query_historic_fire: pt(historicFireAtPoint),
  query_road_hierarchy: (a) => roadHierarchyAtPoint(a.lng, a.lat, a.radius_m ?? 200),
  query_electricity: (a) => electricityAtPoint(a.lng, a.lat, a.radius_m ?? 200),
  query_parks_nearby: (a) => parksNear(a.lng, a.lat, a.radius_m ?? 500),
  query_airport_noise: pt(airportNoiseAtPoint),
  query_suburb: layer('suburbs'),
  query_land_value: async (a) => {
    const prop = await propertyAtPoint(a.lng, a.lat);
    const propid = prop.summary[0]?.propid;
    if (propid == null) throw new Error('No property found at that point.');
    return landValueByPropid(Number(propid));
  },
  query_recent_sales: (a) => recentSalesNear(a.lng, a.lat, a.radius_m ?? 500),
  query_school_catchment: pt(catchmentsAtPoint),
  query_das_nearby: (a) => dasNear(a.lng, a.lat, a.radius_m ?? 1000),
  query_development_potential: async (a) => {
    const [parcel, fsr, height, lot] = await Promise.all([
      parcelAtPoint(a.lng, a.lat), fsrAtPoint(a.lng, a.lat), heightAtPoint(a.lng, a.lat), lotSizeAtPoint(a.lng, a.lat),
    ]);
    const p = parcel.summary[0] ?? {};
    const area = (p.planlotarea as number | null) ?? (p.planlotarea_approx_m2 as number | null) ?? null;
    return developmentPotential({
      areaM2: area,
      fsr: parseBand(fsr.summary[0]?.LAY_CLASS),
      heightM: parseBand(height.summary[0]?.LAY_CLASS),
      minLotM2: parseBand(lot.summary[0]?.LAY_CLASS),
    });
  },
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

const SYSTEM = `You are a NSW place analyser. Use the tools to answer with official NSW data, grounding answers in returned parcel IDs (lotidstring), zone classes, dollar figures, school names, etc. When the user has selected a parcel, treat "this/here" as that parcel. For full "tell me everything" requests, call the relevant spatial tools in parallel. Planning/hazard data is indicative, not legal advice — say so. Easements are digitised cadastre polygons only; covenants and register interests need a paid title search. Historic fire shows past footprints, separate from current bushfire-prone land. Airport noise is ANEF planning contour, not flights-per-day. Electricity assets are open DNSP data, not before-you-dig. Land values are Valuer General UNIMPROVED land values, not market prices — always make that distinction. Development potential is arithmetic on mapped control bands, not planning advice. Sale prices come from registered transfers and may lag the market. Ownership is not available in public data; say so plainly. For general-knowledge or out-of-NSW questions use wikipedia_lookup and clearly note it is general knowledge, not NSW cadastre data. Never invent parcels or figures.`;

export interface AgentResult { reply: string; layers: Record<string, FeatureCollection>; feature_count: number }

export async function runAgentWithClient(ai: GoogleGenAI, message: string, history: { role: 'user'|'model'; text: string }[], selectedParcel: ParcelRef | null): Promise<AgentResult> {
  const ctx = selectedParcel
    ? `\n\n[Selected parcel: ${selectedParcel.lotidstring}${
        selectedParcel.address ? ` — ${selectedParcel.address}` : ''
      }${
        selectedParcel.planlotarea ? `, area ~${Math.round(selectedParcel.planlotarea)} m²` : ''
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

function createGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) return new GoogleGenAI({ apiKey });
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION,
  });
}

export function runAgent(message: string, history: { role: 'user'|'model'; text: string }[] = [], selectedParcel: ParcelRef | null = null): Promise<AgentResult> {
  return runAgentWithClient(createGenAI(), message, history, selectedParcel);
}
