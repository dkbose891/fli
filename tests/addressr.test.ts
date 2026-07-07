import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addressrSearch, addressrDetail, defaultGeocode, normaliseQuery, pidOf } from '../lib/sources/addressr';

// Shapes mirror the live RapidAPI responses (see data/addressr-cache.json).
const SEARCH_RESPONSE = [
  { sla: '10 EXAMPLE ST, SYDNEY NSW 2000', score: 79.3, pid: 'GANSW700000001' },
];
const DETAIL_RESPONSE = {
  pid: 'GANSW700000001',
  sla: '10 EXAMPLE ST, SYDNEY NSW 2000',
  geocoding: { geocodes: [
    { latitude: -33.87, longitude: 151.2, default: false },
    { latitude: -33.871, longitude: 151.201, default: true },
  ] },
};

beforeEach(() => {
  process.env.ADDRESSR_RAPIDAPI_KEY = 'test-key';
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) =>
    new Response(JSON.stringify(url.includes('?q=') ? SEARCH_RESPONSE : DETAIL_RESPONSE), { status: 200 }),
  ));
});
afterEach(() => vi.unstubAllGlobals());

it('normalises queries (trim, lowercase, collapse whitespace)', () => {
  expect(normaliseQuery('  26  Calvert Avenue   KILLARA ')).toBe('26 calvert avenue killara');
});

it('takes pid from the result, falling back to the HATEOAS self href', () => {
  expect(pidOf({ sla: 'x', pid: 'GANSW1' })).toBe('GANSW1');
  expect(pidOf({ sla: 'x', links: { self: { href: '/addresses/GANSW2' } } })).toBe('GANSW2');
  expect(pidOf({ sla: 'x' })).toBeNull();
});

it('search hits the API once, then serves the cache', async () => {
  const first = await addressrSearch('10 Example St Sydney');
  expect(first[0].sla).toContain('EXAMPLE');
  expect(fetch).toHaveBeenCalledTimes(1);
  const again = await addressrSearch('  10 EXAMPLE st   sydney ');
  expect(again).toEqual(first);
  expect(fetch).toHaveBeenCalledTimes(1); // same normalised query -> cache hit
});

it('detail is cached by pid', async () => {
  const d = await addressrDetail('GANSW700000001');
  expect(d.sla).toContain('SYDNEY');
  await addressrDetail('GANSW700000001');
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('the committed seed serves 26 Calvert Ave with zero API calls', async () => {
  const results = await addressrSearch('26 Calvert Avenue Killara NSW');
  expect(results[0].sla).toBe('26 CALVERT AV, KILLARA NSW 2071');
  const pid = pidOf(results[0])!;
  const detail = await addressrDetail(pid);
  expect(defaultGeocode(detail)).toEqual({ lng: 151.1497417, lat: -33.76570143 });
  expect(fetch).not.toHaveBeenCalled();
});

it('defaultGeocode prefers the default geocode (geocoding or geo key)', () => {
  expect(defaultGeocode(DETAIL_RESPONSE)).toEqual({ lng: 151.201, lat: -33.871 });
  expect(defaultGeocode({ geo: { geocodes: [{ latitude: -33.7, longitude: 151.1 }] } })).toEqual({ lng: 151.1, lat: -33.7 });
  expect(defaultGeocode({})).toBeNull();
});

it('throws a clean error when the key is missing', async () => {
  delete process.env.ADDRESSR_RAPIDAPI_KEY;
  await expect(addressrSearch('some never cached query')).rejects.toThrow('ADDRESSR_RAPIDAPI_KEY');
});
