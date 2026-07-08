import { arcgisQuery, pointParams } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

const EPI = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer';
const LAYER = { zoning: 2, fsr: 1, height: 5, lotsize: 4, heritage: 0 } as const;

const at = (layer: number, fields: string) => (lng: number, lat: number): Promise<SourceResult> =>
  arcgisQuery(`${EPI}/${layer}/query`, pointParams(lng, lat, fields));

// Per-layer outFields: the Heritage layer has NO SYM_CODE field — requesting it
// makes the server reject the whole query with a 400 "Failed to execute query".
export const PLANNING_FIELDS = {
  zoning:   'LAY_CLASS,SYM_CODE,PURPOSE,LGA_NAME,EPI_NAME',
  fsr:      'LAY_CLASS,SYM_CODE,LGA_NAME',
  height:   'LAY_CLASS,SYM_CODE,LGA_NAME',
  lotsize:  'LAY_CLASS,SYM_CODE,LGA_NAME',
  heritage: 'LAY_CLASS,LGA_NAME,EPI_NAME,H_NAME,SIG',
} as const;

export const zoningAtPoint   = at(LAYER.zoning,   PLANNING_FIELDS.zoning);
export const fsrAtPoint       = at(LAYER.fsr,      PLANNING_FIELDS.fsr);
export const heightAtPoint    = at(LAYER.height,   PLANNING_FIELDS.height);
export const lotSizeAtPoint   = at(LAYER.lotsize,  PLANNING_FIELDS.lotsize);
export const heritageAtPoint  = at(LAYER.heritage, PLANNING_FIELDS.heritage);
