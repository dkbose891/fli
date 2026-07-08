import { arcgisQuery } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

// Valuer General data via the SIX Maps Valuation service.
// maps.six runs ArcGIS 10.51: no resultRecordCount and no distance/units
// params — use attribute where-clauses or envelope geometry, cap client-side.
const VAL = 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/Valuation/MapServer';
const VALUATION_LAYERS = [5, 6, 7]; // urban, semi-rural, rural (0/4 are group layers — not queryable)
const SALES_LAYERS = [1, 2, 3];

// Values arrive as formatted strings, e.g. " $3,150,000".
export function parseDollars(v: unknown): number | null {
  if (typeof v === 'number') return v > 0 ? v : null;
  if (typeof v !== 'string') return null;
  const n = Number(v.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// sale_date arrives as "22 February 2019".
const MONTHS: Record<string, number> = { january:0, february:1, march:2, april:3, may:4, june:5, july:6, august:7, september:8, october:9, november:10, december:11 };
export function parseSaleDate(s: unknown): Date | null {
  if (typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  return new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
}

function envelope(lng: number, lat: number, radiusM: number) {
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return JSON.stringify({ xmin: lng - dLng, ymin: lat - dLat, xmax: lng + dLng, ymax: lat + dLat, spatialReference: { wkid: 4326 } });
}

async function firstNonEmpty(layers: number[], params: Record<string, string | number | boolean>): Promise<SourceResult> {
  let last: SourceResult = { geojson: { type: 'FeatureCollection', features: [] }, feature_count: 0, summary: [] };
  for (const layer of layers) {
    last = await arcgisQuery(`${VAL}/${layer}/query`, params);
    // Check summary, not feature_count: with returnGeometry=false the rows
    // have attributes but no geometry, and feature_count only counts geometry.
    if (last.summary.length > 0) return last;
  }
  return last;
}

// 5-year land value history for a property (propid from the cadastre property layer).
export async function landValueByPropid(propid: number): Promise<SourceResult> {
  const res = await firstNonEmpty(VALUATION_LAYERS, { where: `propid=${Math.floor(propid)}`, outFields: '*', returnGeometry: false });
  const summary = res.summary.map((a) => ({
    address: a.address,
    zone: a.zone_desc,
    property_area: a.prop_area,
    valuation_basis: a.basis_desc,
    land_values: [1, 2, 3, 4, 5]
      .map((i) => ({ base_date: a[`val${i}_bd`], land_value_aud: parseDollars(a[`val${i}_lv`]) }))
      .filter((v) => v.base_date && v.land_value_aud),
    note: 'Valuer General unimproved land value — not a market/sale price.',
  }));
  return { ...res, summary };
}

// Most recent sales within radiusM of a point (client-side date sort — the
// layer has no date-typed field to order by).
export async function recentSalesNear(lng: number, lat: number, radiusM = 500, max = 15): Promise<SourceResult> {
  const res = await firstNonEmpty(SALES_LAYERS, {
    geometry: envelope(lng, lat, radiusM),
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'house_no,street,suburb,postcode,price,sale_date,area,strata',
    returnGeometry: true,
  });
  const dated = res.geojson.features
    .map((f) => ({ f, d: parseSaleDate(f.properties?.sale_date) }))
    .filter((x): x is { f: typeof x.f; d: Date } => x.d !== null)
    .sort((x, y) => y.d.getTime() - x.d.getTime())
    .slice(0, max);
  const features = dated.map((x) => x.f);
  return {
    geojson: { type: 'FeatureCollection', features },
    feature_count: features.length,
    summary: features.map((f) => {
      const p = f.properties ?? {};
      return { address: `${p.house_no ?? ''} ${p.street ?? ''}, ${p.suburb ?? ''} ${p.postcode ?? ''}`.trim(), price_aud: p.price, sale_date: p.sale_date, area_m2: p.area, strata: p.strata === 1 };
    }),
  };
}
