import type { FeatureCollection } from 'geojson';

export type LayerName = 'parcels' | 'zoning' | 'bushfire' | 'flood' | 'suburbs';

export interface ParcelRef {
  lotidstring: string;
  planlabel?: string;
  planlotarea?: number | null;
  point?: { lng: number; lat: number };
}

export interface LocationInput {
  point?: { lng: number; lat: number };
  bbox?: [number, number, number, number];
  where?: string;
  address?: string;
}

export interface SourceResult {
  geojson: FeatureCollection;
  feature_count: number;
  summary: Record<string, unknown>[];
}
