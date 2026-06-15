import type { Geometry } from 'geojson';

// Approximate bounding box of NSW (incl. a small margin), lng/lat in WGS84.
export const NSW_BBOX = { minLng: 140.9, minLat: -37.6, maxLng: 153.7, maxLat: -28.1 };

export function isInNSW(lng: number, lat: number): boolean {
  return (
    lng >= NSW_BBOX.minLng &&
    lng <= NSW_BBOX.maxLng &&
    lat >= NSW_BBOX.minLat &&
    lat <= NSW_BBOX.maxLat
  );
}

// A representative interior-ish point [lng, lat] for any geometry, or null.
export function representativePoint(geometry: Geometry | null | undefined): { lng: number; lat: number } | null {
  if (!geometry) return null;
  const g = geometry as { type: string; coordinates?: unknown };
  let c: unknown = g.coordinates;
  switch (g.type) {
    case 'Point':
      break;
    case 'Polygon':
    case 'MultiLineString':
      c = (c as number[][][])?.[0]?.[0];
      break;
    case 'MultiPolygon':
      c = (c as number[][][][])?.[0]?.[0]?.[0];
      break;
    case 'LineString':
      c = (c as number[][])?.[0];
      break;
    default:
      return null;
  }
  const pair = c as number[] | undefined;
  if (!pair || typeof pair[0] !== 'number' || typeof pair[1] !== 'number') return null;
  return { lng: pair[0], lat: pair[1] };
}
