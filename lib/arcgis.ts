import { arcgisToGeoJSON } from '@terraformer/arcgis';
import type { Feature, Geometry } from 'geojson';
import type { SourceResult } from '@/types/nsw';
import { cacheGet, cachePut } from '@/lib/nswcache';

const TIMEOUT_MS = 8_000;

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
  if (data.error) throw new Error(`NSW service query rejected: ${data.error.message ?? 'invalid query'}.`);
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

async function fetchOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'nsw-place-analyser' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function arcgisQuery(base: string, params: Record<string, string | number | boolean>): Promise<SourceResult> {
  const url = buildQueryUrl(base, params);
  const hit = cacheGet(url);
  if (hit !== undefined) return esriToGeoJSON(hit as EsriResp);
  // The NSW ArcGIS servers intermittently hang then recover instantly — one
  // retry turns most of those into a fast success instead of a user-facing 502.
  let res: Response;
  try {
    res = await fetchOnce(url);
  } catch {
    try {
      res = await fetchOnce(url);
    } catch (err) {
      throw new Error(err instanceof Error && err.name === 'AbortError' ? 'NSW service timed out.' : 'Could not reach NSW service.');
    }
  }
  if (!res.ok) throw new Error(`NSW service returned HTTP ${res.status}.`);
  const data = (await res.json()) as EsriResp;
  if (!data.error) cachePut(url, data);
  return esriToGeoJSON(data);
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

/** Buffer point query for NSW Spatial FeatureServer layers (roads, POI, DNSP assets). */
export function nearPointParams(lng: number, lat: number, outFields: string, radiusM: number): Record<string, string | number> {
  return {
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: 4326,
    spatialRel: 'esriSpatialRelIntersects',
    distance: radiusM,
    units: 'esriSRUnit_Meter',
    outFields,
  };
}
