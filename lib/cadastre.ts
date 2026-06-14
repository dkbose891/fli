import { arcgisToGeoJSON } from '@terraformer/arcgis';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

const CADASTRE_URL =
  process.env.CADASTRE_URL ??
  'https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Land_Parcel_Property_Theme/FeatureServer/8/query';

const OUT_FIELDS =
  'lotidstring,plannumber,planlabel,planlotarea,planlotareaunits,objectid';

const DEFAULT_MAX = 200;
const HARD_CAP = 500;
const TIMEOUT_MS = 15_000;

export interface CadastreResult {
  geojson: FeatureCollection;
  feature_count: number;
}

interface EsriFeature {
  attributes: Record<string, unknown>;
  geometry: unknown;
}

interface EsriQueryResponse {
  features?: EsriFeature[];
  error?: { message?: string; code?: number };
}

function emptyCollection(): FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}

/**
 * Query the live NSW Cadastre ArcGIS REST service for lot parcels.
 *
 * The live service only supports `f=json` (Esri JSON), NOT `f=geojson`, so we
 * request Esri JSON in WGS84 (outSR=4326) and convert each feature's geometry
 * to GeoJSON with @terraformer/arcgis. MapLibre then renders it directly.
 */
export async function queryCadastre(
  where: string,
  maxFeatures: number = DEFAULT_MAX,
): Promise<CadastreResult> {
  const count = Math.min(Math.max(1, Math.floor(maxFeatures) || DEFAULT_MAX), HARD_CAP);

  const params = new URLSearchParams({
    where,
    outFields: OUT_FIELDS,
    returnGeometry: 'true',
    outSR: '4326', // WGS84 lat/long so MapLibre can draw it
    resultRecordCount: String(count),
    orderByFields: 'objectid',
    f: 'json',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${CADASTRE_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('The NSW Cadastre service timed out. Please try again.');
    }
    throw new Error('Could not reach the NSW Cadastre service.');
  }
  clearTimeout(timer);

  if (!res.ok) {
    throw new Error(`NSW Cadastre service returned HTTP ${res.status}.`);
  }

  const data = (await res.json()) as EsriQueryResponse;

  // ArcGIS returns HTTP 200 with an `error` body for bad where clauses, etc.
  if (data.error) {
    throw new Error(
      `Cadastre query rejected: ${data.error.message ?? 'invalid query'}.`,
    );
  }

  const esriFeatures = data.features ?? [];
  if (esriFeatures.length === 0) {
    return { geojson: emptyCollection(), feature_count: 0 };
  }

  const features: Feature[] = esriFeatures
    .filter((f) => f.geometry)
    .map((f) => ({
      type: 'Feature' as const,
      geometry: arcgisToGeoJSON(f.geometry) as Geometry,
      properties: f.attributes ?? {},
    }));

  return {
    geojson: { type: 'FeatureCollection', features },
    feature_count: features.length,
  };
}
