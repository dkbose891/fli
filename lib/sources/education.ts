import type { SourceResult } from '@/types/nsw';
import type { FeatureCollection } from 'geojson';
import { cacheGet, cachePut } from '@/lib/nswcache';

// NSW DoE school catchments via the School Finder's public CARTO backend.
// Undocumented but official-app infrastructure; returns GeoJSON natively.
// Table names say _2020 but the data carries the current calendar_year.
const CARTO = 'https://cesensw.carto.com/api/v2/sql';
const TIMEOUT_MS = 15_000;

export function catchmentSql(lng: number, lat: number): string {
  // lng/lat are numbers from our own API layer — interpolation is safe; CARTO
  // is read-only SQL anyway.
  return `SELECT school_code, school_name, school_type, catchment_level, calendar_year, the_geom
    FROM catchments_2020
    WHERE ST_Contains(the_geom, ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326))`;
}

export async function catchmentsAtPoint(lng: number, lat: number): Promise<SourceResult> {
  const url = `${CARTO}?q=${encodeURIComponent(catchmentSql(lng, lat))}&format=GeoJSON`;
  let geojson = cacheGet(url) as FeatureCollection | undefined;
  if (!geojson) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    } catch (err) {
      clearTimeout(timer);
      throw new Error(err instanceof Error && err.name === 'AbortError' ? 'School catchment service timed out.' : 'Could not reach the school catchment service.');
    }
    clearTimeout(timer);
    if (!res.ok) throw new Error(`School catchment service returned HTTP ${res.status}.`);
    geojson = (await res.json()) as FeatureCollection;
    cachePut(url, geojson);
  }
  const features = geojson.features ?? [];
  return {
    geojson: { type: 'FeatureCollection', features },
    feature_count: features.length,
    summary: features.map((f) => {
      const p = f.properties ?? {};
      return { school_name: p.school_name, school_type: p.school_type, catchment_level: p.catchment_level, calendar_year: p.calendar_year };
    }),
  };
}
