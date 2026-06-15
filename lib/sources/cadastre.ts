import { arcgisQuery, pointParams } from '@/lib/arcgis';
import { representativePoint } from '@/lib/geo';
import type { SourceResult } from '@/types/nsw';

const SERVER = 'https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Land_Parcel_Property_Theme/FeatureServer';
const LOT = `${SERVER}/8/query`;
const PROPERTY = `${SERVER}/12/query`;
const LOT_FIELDS = 'lotidstring,plannumber,planlabel,planlotarea,planlotareaunits,objectid';

const cap = (n: number) => Math.min(Math.max(1, Math.floor(n) || 200), 500);

export function parcelByWhere(where: string, maxFeatures = 200): Promise<SourceResult> {
  return arcgisQuery(LOT, { where, outFields: LOT_FIELDS, resultRecordCount: cap(maxFeatures), orderByFields: 'objectid' });
}

export function parcelAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(LOT, pointParams(lng, lat, LOT_FIELDS));
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
