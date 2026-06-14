import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/sources/cadastre', () => ({
  parcelByWhere: vi.fn().mockResolvedValue({ geojson:{type:'FeatureCollection',features:[]}, feature_count:0, summary:[] }),
  geocodeAddress: vi.fn(),
  parcelAtPoint: vi.fn(),
}));

vi.mock('../lib/sources/planning', () => ({
  zoningAtPoint: vi.fn().mockResolvedValue({ geojson:{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[151.2,-33.8]},properties:{}}]}, feature_count:1, summary:[{}] }),
  fsrAtPoint: vi.fn().mockResolvedValue({ geojson:{type:'FeatureCollection',features:[]}, feature_count:0, summary:[] }),
  heightAtPoint: vi.fn().mockResolvedValue({ geojson:{type:'FeatureCollection',features:[]}, feature_count:0, summary:[] }),
  lotSizeAtPoint: vi.fn().mockResolvedValue({ geojson:{type:'FeatureCollection',features:[]}, feature_count:0, summary:[] }),
  heritageAtPoint: vi.fn().mockResolvedValue({ geojson:{type:'FeatureCollection',features:[]}, feature_count:0, summary:[] }),
}));

vi.mock('../lib/sources/hazard', () => ({
  bushfireAtPoint: vi.fn().mockResolvedValue({ geojson:{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[151.2,-33.8]},properties:{}}]}, feature_count:1, summary:[{}] }),
  floodAtPoint: vi.fn().mockResolvedValue({ geojson:{type:'FeatureCollection',features:[]}, feature_count:0, summary:[] }),
}));

import { dispatchTool } from '../lib/agent';
import { parcelByWhere } from '../lib/sources/cadastre';

it('routes query_parcel to parcelByWhere with args', async () => {
  await dispatchTool('query_parcel', { where: "plannumber=1", max_features: 50 });
  expect(parcelByWhere).toHaveBeenCalledWith('plannumber=1', 50);
});
it('throws on unknown tool', async () => {
  await expect(dispatchTool('nope', {})).rejects.toThrow('Unknown tool');
});

import { runAgentWithClient } from '../lib/agent';
it('executes parallel tool calls then returns the final reply, collecting layers', async () => {
  let turn = 0;
  const fakeAI = { models: { generateContent: vi.fn(async () => {
    turn++;
    if (turn === 1) return { functionCalls: [
      { name: 'query_zoning', args: { lng:151.2, lat:-33.8 } },
      { name: 'query_bushfire', args: { lng:151.2, lat:-33.8 } } ],
      candidates: [{ content: { parts: [{ functionCall: { name:'query_zoning', args:{} } }] } }] };
    return { text: 'Zoned R2, low bushfire risk.', functionCalls: [] };
  }) } };
  const res = await runAgentWithClient(fakeAI as any, 'analyse this', [], null);
  expect(res.reply).toContain('R2');
  expect(Object.keys(res.layers)).toEqual(expect.arrayContaining(['zoning','bushfire']));
});
