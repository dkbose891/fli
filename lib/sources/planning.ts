import { arcgisQuery, pointParams } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

const EPI = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer';
const LAYER = { zoning: 2, fsr: 1, height: 5, lotsize: 4, heritage: 0 } as const;

const at = (layer: number, fields: string) => (lng: number, lat: number): Promise<SourceResult> =>
  arcgisQuery(`${EPI}/${layer}/query`, pointParams(lng, lat, fields));

export const zoningAtPoint   = at(LAYER.zoning,   'LAY_CLASS,SYM_CODE,PURPOSE,LGA_NAME,EPI_NAME');
export const fsrAtPoint       = at(LAYER.fsr,      'LAY_CLASS,SYM_CODE,LGA_NAME');
export const heightAtPoint    = at(LAYER.height,   'LAY_CLASS,SYM_CODE,LGA_NAME');
export const lotSizeAtPoint   = at(LAYER.lotsize,  'LAY_CLASS,SYM_CODE,LGA_NAME');
export const heritageAtPoint  = at(LAYER.heritage, 'LAY_CLASS,SYM_CODE,LGA_NAME,EPI_NAME');
