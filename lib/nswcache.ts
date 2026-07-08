import seed from '@/data/nsw-cache.json';

// Read-through cache for NSW/CARTO service responses, keyed by full URL.
// Purpose: demo resilience — the NSW ArcGIS servers hang under network
// trouble, and demo queries repeat identical URLs. Seeded from the committed
// data/nsw-cache.json (ships in the build); live responses are added
// in-memory and persisted back to the seed file in dev so they can be
// committed. Delete the file's entries to force fully-live behaviour.
const cache = new Map<string, unknown>(Object.entries(seed as Record<string, unknown>));

export function cacheGet(url: string): unknown {
  return cache.get(url);
}

export function cachePut(url: string, data: unknown): void {
  cache.set(url, data);
  void persist();
}

async function persist(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') return; // never in prod (read-only) or tests
  try {
    const { writeFile } = await import('fs/promises');
    const { join } = await import('path');
    await writeFile(
      join(process.cwd(), 'data', 'nsw-cache.json'),
      JSON.stringify(Object.fromEntries(cache), null, 2) + '\n',
    );
  } catch {
    /* best-effort */
  }
}
