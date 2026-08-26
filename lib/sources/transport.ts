import { arcgisQuery, nearPointParams } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

const ROADS = 'https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Transport_Theme/FeatureServer/5/query';

export const ROAD_HIERARCHY: Record<number, string> = {
  1: 'Motorway',
  2: 'PrimaryRoad',
  3: 'ArterialRoad',
  4: 'SubArterialRoad',
  5: 'DistributorRoad',
  6: 'LocalRoad',
  7: 'UrbanServiceLane',
  8: 'Track-Vehicular',
  9: 'Path',
  10: 'DedicatedBusWay',
  11: 'AccessWay',
};

function summarise(res: SourceResult, radiusM: number): SourceResult {
  const summary = res.summary.map((a) => {
    const code = Number(a.functionhierarchy);
    return {
      functionhierarchy: code,
      road_class: ROAD_HIERARCHY[code] ?? `code_${code}`,
      _radius_m: radiusM,
    };
  });
  return { ...res, summary };
}

/** Nearest road segments within radiusM (default 200 m). */
export function roadHierarchyAtPoint(lng: number, lat: number, radiusM = 200): Promise<SourceResult> {
  return arcgisQuery(ROADS, nearPointParams(lng, lat, 'functionhierarchy', radiusM)).then((r) => summarise(r, radiusM));
}
