import { NextResponse } from 'next/server';
import { addressrSearch, addressrDetail, defaultGeocode, pidOf } from '@/lib/sources/addressr';

export const runtime = 'nodejs';

// GET /api/address?q=...   -> [{ sla, pid }]           (search)
// GET /api/address?id=pid  -> { sla, lng, lat }        (detail with geocode)
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q');
  const id = sp.get('id');
  if (!q && !id) return NextResponse.json({ error: 'q= or id= required.' }, { status: 400 });

  try {
    if (id) {
      const detail = await addressrDetail(id);
      const point = defaultGeocode(detail);
      if (!point) return NextResponse.json({ error: 'No coordinates available for that address.' }, { status: 404 });
      return NextResponse.json({ sla: detail.sla ?? null, ...point });
    }
    const matches = await addressrSearch(q!);
    const results = matches
      .map((m) => ({ sla: m.sla, pid: pidOf(m) }))
      .filter((m) => m.sla && m.pid);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'address lookup failed' }, { status: 502 });
  }
}
