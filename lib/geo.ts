import type { Geometry } from 'geojson';

// Approximate bounding box of NSW (incl. a small margin), lng/lat in WGS84.
export const NSW_BBOX = { minLng: 140.9, minLat: -37.6, maxLng: 153.7, maxLat: -27.9 };

export function isInNSW(lng: number, lat: number): boolean {
  return (
    lng >= NSW_BBOX.minLng &&
    lng <= NSW_BBOX.maxLng &&
    lat >= NSW_BBOX.minLat &&
    lat <= NSW_BBOX.maxLat
  );
}

// Geodesic area of a polygon in m² (spherical excess on a WGS84 sphere, same
// approach as turf/geojson-area). Needed because the NSW cadastre has
// planlotarea = null for many old deposited plans.
const EARTH_R = 6378137;
const rad = (d: number) => (d * Math.PI) / 180;

function ringArea(coords: number[][]): number {
  const n = coords.length;
  if (n < 3) return 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % n];
    const p3 = coords[(i + 2) % n];
    total += (rad(p3[0]) - rad(p1[0])) * Math.sin(rad(p2[1]));
  }
  return (total * EARTH_R * EARTH_R) / 2;
}

function polygonArea(rings: number[][][]): number {
  if (!rings?.length) return 0;
  let area = Math.abs(ringArea(rings[0]));
  for (let i = 1; i < rings.length; i++) area -= Math.abs(ringArea(rings[i])); // holes
  return Math.max(area, 0);
}

export function areaM2(geometry: Geometry | null | undefined): number | null {
  if (!geometry) return null;
  if (geometry.type === 'Polygon') {
    const a = polygonArea(geometry.coordinates as number[][][]);
    return a > 0 ? a : null;
  }
  if (geometry.type === 'MultiPolygon') {
    const a = (geometry.coordinates as number[][][][]).reduce((s, p) => s + polygonArea(p), 0);
    return a > 0 ? a : null;
  }
  return null;
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
