import type { LayerName, SourceResult } from '@/types/nsw';
import { parcelAtPoint } from './sources/cadastre';
import { zoningAtPoint } from './sources/planning';
import { bushfireAtPoint, floodAtPoint } from './sources/hazard';
import { suburbAtPoint } from './sources/admin';

interface LayerDef { atPoint: (lng: number, lat: number) => Promise<SourceResult> }

export const LAYER_REGISTRY: Record<LayerName, LayerDef> = {
  parcels:  { atPoint: parcelAtPoint },
  zoning:   { atPoint: zoningAtPoint },
  bushfire: { atPoint: bushfireAtPoint },
  flood:    { atPoint: floodAtPoint },
  suburbs:  { atPoint: suburbAtPoint },
};
