import type { LayerName, SourceResult } from '@/types/nsw';
import { parcelAtPoint } from './sources/cadastre';
import { zoningAtPoint } from './sources/planning';
import { bushfireAtPoint, floodAtPoint } from './sources/hazard';
import { suburbAtPoint } from './sources/admin';

export type LayerFn = (lng: number, lat: number) => Promise<SourceResult>;

// One function per map layer — shared by the /api/layer proxy and the agent's tools.
export const LAYER_REGISTRY: Record<LayerName, LayerFn> = {
  parcels: parcelAtPoint,
  zoning: zoningAtPoint,
  bushfire: bushfireAtPoint,
  flood: floodAtPoint,
  suburbs: suburbAtPoint,
};
