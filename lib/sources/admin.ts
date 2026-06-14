import { arcgisQuery, pointParams } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

const SUBURB = 'https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Administrative_Boundaries_Theme/FeatureServer/2/query';
export function suburbAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(SUBURB, pointParams(lng, lat, '*'));
}
