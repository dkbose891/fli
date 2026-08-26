import { arcgisQuery, nearPointParams } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

// GeneralCulturalPoint — parks, reserves, sports grounds (layer 2; sourcing doc cites layer 1 PlacePoint but that holds suburbs).
const POI = 'https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Features_of_Interest_Category/FeatureServer/2/query';
const FIELDS = 'generalname,classsubtype';

function summarise(res: SourceResult, radiusM: number): SourceResult {
  return {
    ...res,
    summary: res.summary.slice(0, 20).map((a) => ({
      name: a.generalname,
      classsubtype: a.classsubtype,
      _radius_m: radiusM,
    })),
  };
}

/** Parks, reserves and recreation POI within radiusM (default 500 m). */
export function parksNear(lng: number, lat: number, radiusM = 500): Promise<SourceResult> {
  return arcgisQuery(POI, { ...nearPointParams(lng, lat, FIELDS, radiusM), resultRecordCount: 20 }).then((r) =>
    summarise(r, radiusM),
  );
}
