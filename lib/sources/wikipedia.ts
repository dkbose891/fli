export interface WikiResult { title: string; extract: string; source: 'wikipedia' }

export async function wikipediaLookup(query: string): Promise<WikiResult> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Wikipedia lookup failed.');
  const d = (await res.json()) as { title?: string; extract?: string };
  return { title: d.title ?? query, extract: d.extract ?? 'No summary found.', source: 'wikipedia' };
}
