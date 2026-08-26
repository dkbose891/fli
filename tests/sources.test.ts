import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../lib/arcgis', () => ({
  arcgisQuery: vi.fn(),
  pointParams: (lng: number, lat: number, of: string) => ({ geometry: `${lng},${lat}`, outFields: of }),
  nearPointParams: (lng: number, lat: number, of: string, r: number) => ({ geometry: `${lng},${lat}`, outFields: of, distance: r }),
}));
import { arcgisQuery } from '../lib/arcgis';
import { parcelByWhere, parcelAtPoint } from '../lib/sources/cadastre';
import { zoningAtPoint } from '../lib/sources/planning';
import { bushfireAtPoint, landslideAtPoint, historicFireAtPoint, airportNoiseAtPoint } from '../lib/sources/hazard';
import { easementsAtPoint } from '../lib/sources/easements';
import { builtCharacterAtPoint, specialCharacterAtPoint, nativeVegetationAtPoint } from '../lib/sources/provisions';
import { roadHierarchyAtPoint } from '../lib/sources/transport';
import { electricityAtPoint } from '../lib/sources/electricity';
import { parksNear } from '../lib/sources/poi';
import { suburbAtPoint } from '../lib/sources/admin';
import { wikipediaLookup } from '../lib/sources/wikipedia';

const fake = { geojson: { type: 'FeatureCollection', features: [] }, feature_count: 0, summary: [] };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(arcgisQuery).mockResolvedValue(fake as any); });

it('bushfireAtPoint hits Planning_Portal_Hazard layer 229', async () => {
  await bushfireAtPoint(151.2, -33.8);
  expect(vi.mocked(arcgisQuery).mock.calls.at(-1)![0]).toContain('Planning_Portal_Hazard/MapServer/229/query');
});

it('easementsAtPoint hits cadastre easement layer 9', async () => {
  await easementsAtPoint(151.2, -33.8);
  const [base, params] = vi.mocked(arcgisQuery).mock.calls.at(-1)!;
  expect(base).toContain('FeatureServer/9/query');
  expect(String(params.outFields)).toContain('easementtype');
});

it('builtCharacterAtPoint hits Local Provisions layer 432', async () => {
  await builtCharacterAtPoint(151.2, -33.8);
  expect(vi.mocked(arcgisQuery).mock.calls.at(-1)![0]).toContain('Planning_Portal_Local_Provisions/MapServer/432/query');
});

it('specialCharacterAtPoint hits Local Provisions layer 568', async () => {
  await specialCharacterAtPoint(151.2, -33.8);
  expect(vi.mocked(arcgisQuery).mock.calls.at(-1)![0]).toContain('/568/query');
});

it('nativeVegetationAtPoint hits Local Provisions layer 565', async () => {
  await nativeVegetationAtPoint(151.2, -33.8);
  expect(vi.mocked(arcgisQuery).mock.calls.at(-1)![0]).toContain('/565/query');
});

it('landslideAtPoint hits hazard layer 232', async () => {
  await landslideAtPoint(151.2, -33.8);
  expect(vi.mocked(arcgisQuery).mock.calls.at(-1)![0]).toContain('/232/query');
});

it('historicFireAtPoint hits NSWFireHistory layer 0', async () => {
  await historicFireAtPoint(151.2, -33.8);
  expect(vi.mocked(arcgisQuery).mock.calls.at(-1)![0]).toContain('NSWFireHistory/FeatureServer/0/query');
});

it('airportNoiseAtPoint hits Protection MapServer layer 2', async () => {
  await airportNoiseAtPoint(151.2, -33.8);
  expect(vi.mocked(arcgisQuery).mock.calls.at(-1)![0]).toContain('Planning/Protection/MapServer/2/query');
});

it('roadHierarchyAtPoint uses nearPointParams with distance', async () => {
  await roadHierarchyAtPoint(151.2, -33.8, 300);
  const [base, params] = vi.mocked(arcgisQuery).mock.calls.at(-1)!;
  expect(base).toContain('NSW_Transport_Theme/FeatureServer/5/query');
  expect(params.distance).toBe(300);
});

it('parksNear queries GeneralCulturalPoint with radius', async () => {
  await parksNear(151.2, -33.8, 400);
  const [base, params] = vi.mocked(arcgisQuery).mock.calls.at(-1)!;
  expect(base).toContain('NSW_Features_of_Interest_Category/FeatureServer/2/query');
  expect(params.distance).toBe(400);
});

it('electricityAtPoint resolves DNSP then queries assets', async () => {
  const empty = { geojson: { type: 'FeatureCollection' as const, features: [] }, feature_count: 0, summary: [] };
  const hit = { geojson: { type: 'FeatureCollection' as const, features: [{ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [151.2, -33.8] }, properties: { name: 'feeder', voltage: 11 } }] }, feature_count: 1, summary: [{ name: 'feeder', voltage: 11 }] };
  vi.mocked(arcgisQuery)
    .mockResolvedValueOnce(empty)
    .mockResolvedValueOnce(hit)
    .mockResolvedValueOnce(hit);
  const r = await electricityAtPoint(151.2, -33.8);
  expect(vi.mocked(arcgisQuery).mock.calls[0][0]).toContain('EE_Service_Areas');
  expect(vi.mocked(arcgisQuery).mock.calls[1][0]).toContain('Ausgrid_DTAPR_2023');
  expect(vi.mocked(arcgisQuery).mock.calls[2][0]).toContain('Ausgrid_DTAPR_2023');
  expect(r.summary[0]?.dnsp).toBe('Ausgrid');
});
it('suburbAtPoint queries admin boundaries by point', async () => {
  await suburbAtPoint(151.2, -33.8);
  expect(vi.mocked(arcgisQuery).mock.calls.at(-1)![1].geometry).toBe('151.2,-33.8');
});

it('zoningAtPoint hits Land Zoning layer 2 with point geometry', async () => {
  await zoningAtPoint(151.2, -33.8);
  const [base, params] = vi.mocked(arcgisQuery).mock.calls.at(-1)!;
  expect(base).toContain('EPI_Primary_Planning_Layers/MapServer/2/query');
  expect(params.geometry).toBe('151.2,-33.8');
  expect(String(params.outFields)).toContain('LAY_CLASS');
});

it('returns the summary extract and flags it as general knowledge', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ extract: 'Brisbane is...', title: 'Brisbane' }) }) as any;
  const r = await wikipediaLookup('Brisbane');
  expect(r.extract).toContain('Brisbane is');
  expect(r.source).toBe('wikipedia');
});

describe('cadastre', () => {
  it('parcelByWhere caps max_features at 500 and passes outFields', async () => {
    await parcelByWhere("plannumber=270928", 9999);
    const [, params] = vi.mocked(arcgisQuery).mock.calls[0];
    expect(params.resultRecordCount).toBe(500);
    expect(String(params.outFields)).toContain('lotidstring');
    expect(params.where).toBe('plannumber=270928');
  });
  it('parcelAtPoint queries the lot layer with a point geometry', async () => {
    await parcelAtPoint(151.2, -33.8);
    const [base, params] = vi.mocked(arcgisQuery).mock.calls[0];
    expect(base).toContain('FeatureServer/8/query');
    expect(params.geometry).toBe('151.2,-33.8');
  });
});

it('heritage outFields must not request SYM_CODE (layer has no such field)', async () => {
  const { PLANNING_FIELDS } = await import('../lib/sources/planning');
  expect(PLANNING_FIELDS.heritage).not.toContain('SYM_CODE');
  expect(PLANNING_FIELDS.heritage).toContain('H_NAME');
});
