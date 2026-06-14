import { NextResponse } from 'next/server';
import { LAYER_REGISTRY } from '@/lib/layers';
import type { LayerName } from '@/types/nsw';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const def = LAYER_REGISTRY[name as LayerName];
  if (!def) return NextResponse.json({ error: `Unknown layer '${name}'.` }, { status: 404 });

  const sp = new URL(req.url).searchParams;
  const point = sp.get('point');
  if (!point) return NextResponse.json({ error: 'point=lng,lat required.' }, { status: 400 });
  const [lng, lat] = point.split(',').map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return NextResponse.json({ error: 'invalid point.' }, { status: 400 });

  try {
    const { geojson, feature_count } = await def.atPoint(lng, lat);
    return NextResponse.json({ geojson, feature_count });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'layer query failed' }, { status: 502 });
  }
}
