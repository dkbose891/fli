import { arcgisQuery, pointParams } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

const LOCAL = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Local_Provisions/MapServer';
const LAYER = { builtCharacter: 432, specialCharacter: 568, nativeVegetation: 565 } as const;
const FIELDS = 'LAY_CLASS,MAP_NAME,LGA_NAME,LABEL,CLASS_DESCRIPTION,EPI_NAME';

const at = (layer: number) => (lng: number, lat: number): Promise<SourceResult> =>
  arcgisQuery(`${LOCAL}/${layer}/query`, pointParams(lng, lat, FIELDS));

export const builtCharacterAtPoint = at(LAYER.builtCharacter);
export const specialCharacterAtPoint = at(LAYER.specialCharacter);
export const nativeVegetationAtPoint = at(LAYER.nativeVegetation);
