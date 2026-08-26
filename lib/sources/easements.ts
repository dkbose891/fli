import { arcgisQuery, pointParams } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

const EASEMENTS = 'https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Land_Parcel_Property_Theme/FeatureServer/9/query';
const FIELDS = 'easementtype,easementwidth,planoid';

export function easementsAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(EASEMENTS, pointParams(lng, lat, FIELDS));
}
