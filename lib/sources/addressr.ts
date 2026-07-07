import seed from '@/data/addressr-cache.json';

const BASE = 'https://addressr.p.rapidapi.com';
const TIMEOUT_MS = 15_000;

// Shapes match the live RapidAPI responses (which differ from the repo swagger:
// search results carry a top-level `pid`, and detail geo sits under `geocoding`).
// The swagger variants (`links.self.href`, `geo`) are kept as fallbacks.
export interface AddressrMatch {
  sla: string;
  score?: number;
  pid?: string;
  links?: { self?: { href?: string } };
}

export interface AddressrGeocode {
  latitude: number;
  longitude: number;
  default?: boolean;
}

export interface AddressrDetail {
  pid?: string;
  sla?: string;
  structured?: Record<string, unknown>;
  geocoding?: { geocodes?: AddressrGeocode[] };
  geo?: { geocodes?: AddressrGeocode[] };
}

// Read-through cache: the RapidAPI free tier allows very few calls, so every
// response is kept. Seeded from the committed data/addressr-cache.json (ships
// in the build); live responses are added in-memory and persisted back to the
// seed file in dev so they can be committed.
const cache = new Map<string, unknown>(Object.entries(seed as Record<string, unknown>));

async function persistCache(): Promise<void> {
  // Dev only: never in production (read-only container) and never under test
  // (mocked responses must not overwrite the committed seed).
  if (process.env.NODE_ENV !== 'development') return;
  try {
    const { writeFile } = await import('fs/promises');
    const { join } = await import('path');
    await writeFile(
      join(process.cwd(), 'data', 'addressr-cache.json'),
      JSON.stringify(Object.fromEntries(cache), null, 2) + '\n',
    );
  } catch {
    /* cache persistence is best-effort */
  }
}

async function addressrGet(path: string): Promise<unknown> {
  if (cache.has(path)) return cache.get(path);

  const key = process.env.ADDRESSR_RAPIDAPI_KEY;
  if (!key) throw new Error('Address search is not configured (ADDRESSR_RAPIDAPI_KEY missing).');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: {
        Accept: 'application/json',
        'x-rapidapi-host': 'addressr.p.rapidapi.com',
        'x-rapidapi-key': key,
      },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new Error(err instanceof Error && err.name === 'AbortError' ? 'Address service timed out.' : 'Could not reach the address service.');
  }
  clearTimeout(timer);
  if (!res.ok) throw new Error(`Address service returned HTTP ${res.status}.`);
  const data = await res.json();
  cache.set(path, data);
  void persistCache();
  return data;
}

export function normaliseQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function pidOf(m: AddressrMatch): string | null {
  return m.pid ?? m.links?.self?.href?.split('/').filter(Boolean).pop() ?? null;
}

export async function addressrSearch(q: string): Promise<AddressrMatch[]> {
  const data = await addressrGet(`/addresses?q=${encodeURIComponent(normaliseQuery(q))}`);
  return Array.isArray(data) ? (data as AddressrMatch[]) : [];
}

export function addressrDetail(pid: string): Promise<AddressrDetail> {
  return addressrGet(`/addresses/${encodeURIComponent(pid)}`) as Promise<AddressrDetail>;
}

export function defaultGeocode(detail: AddressrDetail): { lng: number; lat: number } | null {
  const geocodes = detail.geocoding?.geocodes ?? detail.geo?.geocodes ?? [];
  const g = geocodes.find((c) => c.default) ?? geocodes[0];
  if (!g || typeof g.longitude !== 'number' || typeof g.latitude !== 'number') return null;
  return { lng: g.longitude, lat: g.latitude };
}
