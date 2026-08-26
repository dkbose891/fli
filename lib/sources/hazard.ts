import { arcgisQuery, pointParams } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

// NSW Planning Portal Hazard service — reliable point-queryable hazard layers.
const HAZARD = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Hazard/MapServer';
const BUSHFIRE = `${HAZARD}/229/query`; // Bush Fire Prone Land
const FLOOD = `${HAZARD}/230/query`; // Flood Planning Map
const LANDSLIDE = `${HAZARD}/232/query`; // Landslide Risk Land
const FIRE_HISTORY = 'https://portal.spatial.nsw.gov.au/server/rest/services/Hosted/NSWFireHistory/FeatureServer/0/query';
const ANEF = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Protection/MapServer/2/query';

export function bushfireAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(BUSHFIRE, pointParams(lng, lat, 'Category,d_Category,Guideline'));
}

export function floodAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(FLOOD, pointParams(lng, lat, '*'));
}

export function landslideAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(LANDSLIDE, pointParams(lng, lat, 'LAY_CLASS,LAY_NAME,LGA_NAME,EPI_NAME'));
}

export function historicFireAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(FIRE_HISTORY, pointParams(lng, lat, 'fire_name,ignition_date,area_ha,fire_type'));
}

export function airportNoiseAtPoint(lng: number, lat: number): Promise<SourceResult> {
  return arcgisQuery(ANEF, pointParams(lng, lat, 'ANEF_CODE,LAY_NAME,EPI_NAME,LGA_NAME'));
}
