import { NextResponse } from 'next/server';
import { LAYER_REGISTRY } from '@/lib/layers';
import { isInNSW } from '@/lib/geo';
import type { LayerName } from '@/types/nsw';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const query = LAYER_REGISTRY[name as LayerName];
  if (!query) return NextResponse.json({ error: `Unknown layer '${name}'.` }, { status: 404 });

  const sp = new URL(req.url).searchParams;
  const point = sp.get('point');
  if (!point) return NextResponse.json({ error: 'point=lng,lat required.' }, { status: 400 });
  const [lng, lat] = point.split(',').map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return NextResponse.json({ error: 'invalid point.' }, { status: 400 });
  if (!isInNSW(lng, lat)) return NextResponse.json({ error: 'That location is outside NSW — this tool only covers New South Wales.' }, { status: 422 });

  try {
    const { geojson, feature_count } = await query(lng, lat);
    return NextResponse.json({ geojson, feature_count });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'layer query failed' }, { status: 502 });
  }
}
