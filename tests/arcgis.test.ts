import { describe, it, expect } from 'vitest';
import { esriToGeoJSON, buildQueryUrl } from '../lib/arcgis';

describe('buildQueryUrl', () => {
  it('encodes where + standard params and forces f=json/outSR=4326', () => {
    const url = buildQueryUrl('https://x/query', { where: "a='1'", outFields: 'a,b', resultRecordCount: 10 });
    expect(url).toContain('f=json');
    expect(url).toContain('outSR=4326');
    expect(url).toContain('returnGeometry=true');
    expect(url).toContain(encodeURIComponent("a='1'"));
    expect(url).toContain('resultRecordCount=10');
  });
});

describe('esriToGeoJSON', () => {
  it('converts esri rings to a GeoJSON FeatureCollection with attributes as properties', () => {
    const esri = { features: [{ attributes: { lotidstring: '1//DP1' }, geometry: { rings: [[[151,-33],[151.1,-33],[151.1,-33.1],[151,-33]]] } }] };
    const out = esriToGeoJSON(esri);
    expect(out.feature_count).toBe(1);
    expect(out.geojson.features[0].properties?.lotidstring).toBe('1//DP1');
    expect(out.geojson.features[0].geometry?.type).toBe('Polygon');
    expect(out.summary[0].lotidstring).toBe('1//DP1');
  });
  it('returns empty collection when no features', () => {
    expect(esriToGeoJSON({ features: [] }).feature_count).toBe(0);
  });
  it('throws a clean error when esri returns an error body', () => {
    expect(() => esriToGeoJSON({ error: { message: 'bad where' } })).toThrow('bad where');
  });
});
