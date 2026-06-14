import { NextResponse } from 'next/server';
import { runAgent } from '@/lib/agent';
import type { ParcelRef } from '@/types/nsw';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { message?: string; history?: { role:'user'|'model'; text:string }[]; selectedParcel?: ParcelRef | null };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const message = body.message?.trim();
  if (!message) return NextResponse.json({ error: 'A message is required.' }, { status: 400 });
  try {
    const result = await runAgent(message, body.history ?? [], body.selectedParcel ?? null);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[chat]', err);
    return NextResponse.json({ error: `Sorry — ${err instanceof Error ? err.message : 'agent error'}` }, { status: 500 });
  }
}
