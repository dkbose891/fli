import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../lib/arcgis', () => ({
  arcgisQuery: vi.fn(),
  pointParams: (lng: number, lat: number, of: string) => ({ geometry: `${lng},${lat}`, outFields: of }),
}));
import { arcgisQuery } from '../lib/arcgis';
import { parcelByWhere, parcelAtPoint } from '../lib/sources/cadastre';
import { zoningAtPoint } from '../lib/sources/planning';
import { bushfireAtPoint } from '../lib/sources/hazard';
import { suburbAtPoint } from '../lib/sources/admin';
import { wikipediaLookup } from '../lib/sources/wikipedia';

const fake = { geojson: { type: 'FeatureCollection', features: [] }, feature_count: 0, summary: [] };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(arcgisQuery).mockResolvedValue(fake as any); });

it('bushfireAtPoint hits Fire/BFPL layer 0', async () => {
  await bushfireAtPoint(151.2, -33.8);
  expect(vi.mocked(arcgisQuery).mock.calls.at(-1)![0]).toContain('Fire/BFPL/MapServer/0/query');
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
