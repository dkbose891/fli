import { arcgisQuery, nearPointParams, pointParams } from '@/lib/arcgis';
import type { SourceResult } from '@/types/nsw';

const EE_SERVICE_AREA = 'https://services-ap1.arcgis.com/3o0vFs4fJRsuYuBO/arcgis/rest/services/EE_Service_Areas/FeatureServer/0/query';
const EE_POLES = 'https://services-ap1.arcgis.com/3o0vFs4fJRsuYuBO/arcgis/rest/services/pole_timber_PTIM_/FeatureServer/0/query';
const AUSGRID = 'https://portal.data.nsw.gov.au/arcgis/rest/services/Hosted/Ausgrid_DTAPR_2023/FeatureServer/0/query';
const ENDEAVOUR = 'https://portal.data.nsw.gov.au/arcgis/rest/services/Hosted/Endeavour_Energy_UHC_Lines/FeatureServer/0/query';

export type DnspName = 'Essential Energy' | 'Ausgrid' | 'Endeavour Energy' | 'Unknown';

const DNSP_PROBE_M = 5000;
const ASSET_RADIUS_M = 200;

async function inServiceArea(url: string, lng: number, lat: number, radiusM?: number): Promise<boolean> {
  const params = radiusM
    ? nearPointParams(lng, lat, 'objectid', radiusM)
    : pointParams(lng, lat, 'objectid');
  const res = await arcgisQuery(url, params);
  return res.feature_count > 0;
}

export async function resolveDnsp(lng: number, lat: number): Promise<DnspName> {
  if (await inServiceArea(EE_SERVICE_AREA, lng, lat)) return 'Essential Energy';
  if (await inServiceArea(AUSGRID, lng, lat, DNSP_PROBE_M)) return 'Ausgrid';
  if (await inServiceArea(ENDEAVOUR, lng, lat, DNSP_PROBE_M)) return 'Endeavour Energy';
  return 'Unknown';
}

const ASSET_QUERY: Record<Exclude<DnspName, 'Unknown'>, { url: string; fields: string }> = {
  'Essential Energy': { url: EE_POLES, fields: 'TYPE_A,W_LABEL_A,SERV_STA_A' },
  Ausgrid: { url: AUSGRID, fields: 'name,voltage,owner' },
  'Endeavour Energy': { url: ENDEAVOUR, fields: 'name,voltage,owner' },
};

function assetSummary(dnsp: DnspName, res: SourceResult, radiusM: number): SourceResult {
  const assets = res.summary.slice(0, 10).map((a) => ({
    ...(dnsp === 'Essential Energy'
      ? { type: a.TYPE_A, label: a.W_LABEL_A, status: a.SERV_STA_A }
      : { name: a.name, voltage: a.voltage, owner: a.owner }),
  }));
  return {
    ...res,
    summary: [{ dnsp, assets_nearby: res.feature_count, radius_m: radiusM, assets, _note: 'Indicative open-data assets only; not a before-you-dig authority.' }],
  };
}

/** Resolve the DNSP by service area, then query nearby distribution assets. */
export async function electricityAtPoint(lng: number, lat: number, radiusM = ASSET_RADIUS_M): Promise<SourceResult> {
  const dnsp = await resolveDnsp(lng, lat);
  if (dnsp === 'Unknown') {
    return {
      geojson: { type: 'FeatureCollection', features: [] },
      feature_count: 0,
      summary: [{ dnsp, assets_nearby: 0, _note: 'Could not determine DNSP for this location.' }],
    };
  }
  const { url, fields } = ASSET_QUERY[dnsp];
  const assets = await arcgisQuery(url, nearPointParams(lng, lat, fields, radiusM));
  return assetSummary(dnsp, assets, radiusM);
}
