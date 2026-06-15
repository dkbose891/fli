import { arcgisQuery, pointParams } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

// NSW Planning Portal Hazard service — reliable point-queryable hazard layers.
const HAZARD = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Hazard/MapServer';
const BUSHFIRE = `${HAZARD}/229/query`; // Bush Fire Prone Land
const FLOOD = `${HAZARD}/230/query`; // Flood Planning Map

export function bushfireAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(BUSHFIRE, pointParams(lng, lat, 'Category,d_Category,Guideline'));
}

export function floodAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(FLOOD, pointParams(lng, lat, '*'));
}
