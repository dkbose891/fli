import { arcgisQuery, pointParams } from '@/lib/arcgis';
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

export function geocodeAddress(address: string, maxFeatures = 5): Promise<SourceResult> {
  const safe = address.toUpperCase().replace(/'/g, "''");
  return arcgisQuery(PROPERTY, {
    where: `address LIKE '%${safe}%'`,
    outFields: 'address,housenumber,propid,principaladdresstype',
    resultRecordCount: cap(maxFeatures),
  });
}
