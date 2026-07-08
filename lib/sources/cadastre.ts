import { arcgisQuery, pointParams } from '@/lib/arcgis';
import { areaM2, representativePoint } from '@/lib/geo';
import type { SourceResult } from '@/types/nsw';

const SERVER = 'https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Land_Parcel_Property_Theme/FeatureServer';
const LOT = `${SERVER}/8/query`;
const PROPERTY = `${SERVER}/12/query`;
const LOT_FIELDS = 'lotidstring,plannumber,planlabel,planlotarea,planlotareaunits,objectid';

const cap = (n: number) => Math.min(Math.max(1, Math.floor(n) || 200), 500);

// The cadastre has planlotarea = null for many old plans (e.g. 1900s DPs).
// We hold the boundary polygon, so fall back to a computed geodesic area.
function withComputedArea(res: SourceResult): SourceResult {
  const summary = res.geojson.features.map((f) => {
    const props = { ...(f.properties ?? {}) };
    if (props.planlotarea == null) {
      const a = areaM2(f.geometry);
      if (a) props.planlotarea_approx_m2 = Math.round(a);
    }
    return props;
  });
  return { ...res, summary };
}

export async function parcelByWhere(where: string, maxFeatures = 200): Promise<SourceResult> {
  return withComputedArea(await arcgisQuery(LOT, { where, outFields: LOT_FIELDS, resultRecordCount: cap(maxFeatures), orderByFields: 'objectid' }));
}

export async function parcelAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return withComputedArea(await arcgisQuery(LOT, pointParams(lng, lat, LOT_FIELDS)));
}

// Property (not lot) at a point — the propid is the key into the Valuer
// General valuation service.
export function propertyAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(PROPERTY, pointParams(lng, lat, 'propid,address,principaladdresstype'));
}

export async function geocodeAddress(address: string, maxFeatures = 5): Promise<SourceResult> {
  const safe = address.toUpperCase().replace(/'/g, "''");
  const res = await arcgisQuery(PROPERTY, {
    where: `address LIKE '%${safe}%'`,
    outFields: 'address,housenumber,propid,principaladdresstype',
    resultRecordCount: cap(maxFeatures),
  });
  // Enrich each summary row with a representative lng/lat so the agent can chain
  // address -> point-based tools (zoning, bushfire, ...) without extra calls.
  const summary = res.geojson.features.map((f) => {
    const p = representativePoint(f.geometry);
    return { ...(f.properties ?? {}), ...(p ? { lng: p.lng, lat: p.lat } : {}) };
  });
  return { ...res, summary };
}
