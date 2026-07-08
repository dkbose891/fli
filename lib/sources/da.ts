import { arcgisQuery } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

// NSW ePlanning DA Tracking (point per development application).
// Server is ArcGIS 10.91 — distance/units radius queries work.
// LODGEMENT_DATE is a *string* like '20230224000000' (sometimes with
// fractional seconds, sometimes null) — filter and sort as strings.
const DA = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/DA_Tracking/MapServer/0/query';
const FIELDS = 'DA_NUMBER,PLANNING_PORTAL_APP_NUMBER,STATUS,LODGEMENT_DATE,DETERMINED_DATE,APPLICATION_TYPE,TYPE_OF_DEVELOPMENT,DEVELOPMENT_DETAILED_DESC,PRIMARY_ADDRESS,SUBURBNAME,COST_OF_DEVELOPMENT,UNITS_OR_DWELLINGS_PROPOSED,STOREYS_PROPOSED';

export function lodgedSince(yearsBack: number, now = new Date()): string {
  return `${now.getUTCFullYear() - yearsBack}0101`;
}

function daParams(lng: number, lat: number, radiusM: number, where?: string) {
  return {
    geometry: JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } }),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    distance: radiusM,
    units: 'esriSRUnit_Meter',
    outFields: FIELDS,
    orderByFields: 'LODGEMENT_DATE DESC',
    resultRecordCount: 20,
    ...(where ? { where } : {}),
  };
}

function summarise(res: SourceResult, coverage: string): SourceResult {
  return {
    ...res,
    summary: res.summary.slice(0, 20).map((a) => ({
      da_number: a.DA_NUMBER ?? a.PLANNING_PORTAL_APP_NUMBER,
      status: a.STATUS,
      lodged: typeof a.LODGEMENT_DATE === 'string' ? a.LODGEMENT_DATE.slice(0, 8) : null,
      type: a.TYPE_OF_DEVELOPMENT,
      description: a.DEVELOPMENT_DETAILED_DESC,
      address: a.PRIMARY_ADDRESS,
      cost_aud: a.COST_OF_DEVELOPMENT,
      dwellings_proposed: a.UNITS_OR_DWELLINGS_PROPOSED,
      storeys_proposed: a.STOREYS_PROPOSED,
      _coverage: coverage,
    })),
  };
}

// DAs near a point, most recent first. The dataset lags in some LGAs (years
// behind in places) — if nothing recent exists we return the latest available
// and say so via _coverage rather than reporting a bare zero.
export async function dasNear(lng: number, lat: number, radiusM = 1000): Promise<SourceResult> {
  const recent = await arcgisQuery(DA, daParams(lng, lat, radiusM, `LODGEMENT_DATE >= '${lodgedSince(2)}'`));
  if (recent.feature_count > 0) return summarise(recent, `lodged since ${lodgedSince(2).slice(0, 4)}, within ${radiusM}m`);
  const any = await arcgisQuery(DA, daParams(lng, lat, radiusM));
  return summarise(any, `no DAs lodged since ${lodgedSince(2).slice(0, 4)} in this dataset within ${radiusM}m — showing the most recent available (data for this area may lag)`);
}
