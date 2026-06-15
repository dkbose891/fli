export interface WikiResult { title: string; extract: string; source: 'wikipedia' }

// Wikimedia REST requires a descriptive User-Agent or returns 403.
const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'nsw-place-analyser/1.0 (https://github.com/dkbose891/fli)',
};

// The summary endpoint needs an exact page title, so resolve a title via search first.
async function resolveTitle(query: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  const d = (await res.json()) as { pages?: { key?: string; title?: string }[] };
  return d.pages?.[0]?.key ?? d.pages?.[0]?.title ?? null;
}

export async function wikipediaLookup(query: string): Promise<WikiResult> {
  const title = (await resolveTitle(query)) ?? query;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Wikipedia lookup failed for "${title}".`);
  const d = (await res.json()) as { title?: string; extract?: string };
  return { title: d.title ?? title, extract: d.extract ?? 'No summary found.', source: 'wikipedia' };
}
