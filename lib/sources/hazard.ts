import { arcgisQuery, pointParams } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

const BFPL = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Fire/BFPL/MapServer/0/query';
export function bushfireAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(BFPL, pointParams(lng, lat, 'Category,d_Category,Guideline'));
}

const FLOOD = 'https://portal.spatial.nsw.gov.au/server/rest/services/Floods_Historical/MapServer/0/query';
export function floodAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(FLOOD, pointParams(lng, lat, '*'));
}
