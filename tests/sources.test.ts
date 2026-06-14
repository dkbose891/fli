import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../lib/arcgis', () => ({
  arcgisQuery: vi.fn(),
  pointParams: (lng: number, lat: number, of: string) => ({ geometry: `${lng},${lat}`, outFields: of }),
}));
import { arcgisQuery } from '../lib/arcgis';
import { parcelByWhere, parcelAtPoint } from '../lib/sources/cadastre';

const fake = { geojson: { type: 'FeatureCollection', features: [] }, feature_count: 0, summary: [] };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(arcgisQuery).mockResolvedValue(fake as any); });

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
