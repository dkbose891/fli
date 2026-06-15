import { arcgisToGeoJSON } from '@terraformer/arcgis';
import type { Feature, Geometry } from 'geojson';
import type { SourceResult } from '@/types/nsw';

const TIMEOUT_MS = 15_000;

export function buildQueryUrl(base: string, params: Record<string, string | number | boolean>): string {
  const defaults: Record<string, string> = { returnGeometry: 'true', outSR: '4326', f: 'json' };
  const merged: Record<string, string> = { ...defaults };
  for (const [k, v] of Object.entries(params)) merged[k] = String(v);
  const qs = Object.entries(merged)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${base}?${qs}`;
}

interface EsriResp {
  features?: { attributes: Record<string, unknown>; geometry?: unknown }[];
  error?: { message?: string };
}

export function esriToGeoJSON(data: EsriResp): SourceResult {
  if (data.error) throw new Error(`Cadastre query rejected: ${data.error.message ?? 'invalid query'}.`);
  const esri = data.features ?? [];
  const features: Feature[] = esri
    .filter((f) => f.geometry)
    .map((f) => ({ type: 'Feature', geometry: arcgisToGeoJSON(f.geometry) as Geometry, properties: f.attributes ?? {} }));
  return {
    geojson: { type: 'FeatureCollection', features },
    feature_count: features.length,
    summary: esri.map((f) => f.attributes ?? {}),
  };
}

export async function arcgisQuery(base: string, params: Record<string, string | number | boolean>): Promise<SourceResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(buildQueryUrl(base, params), {
      headers: { Accept: 'application/json', 'User-Agent': 'nsw-place-analyser' },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new Error(err instanceof Error && err.name === 'AbortError' ? 'NSW service timed out.' : 'Could not reach NSW service.');
  }
  clearTimeout(timer);
  if (!res.ok) throw new Error(`NSW service returned HTTP ${res.status}.`);
  return esriToGeoJSON((await res.json()) as EsriResp);
}

export function pointParams(lng: number, lat: number, outFields: string): Record<string, string | number> {
  // JSON geometry (not the "lng,lat" shorthand): the ArcGIS MapServer endpoints
  // (ePlanning zoning, etc.) reject the shorthand for point intersects but accept this.
  return {
    geometry: JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } }),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields,
  };
}
