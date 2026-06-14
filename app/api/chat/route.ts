import { NextResponse } from 'next/server';
import { runAgent, type ChatHistoryItem } from '@/lib/agent';

export const runtime = 'nodejs'; // Vertex SDK needs Node, not edge.

interface ChatRequestBody {
  message?: string;
  history?: ChatHistoryItem[];
}

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: 'A message is required.' }, { status: 400 });
  }

  try {
    const result = await runAgent(message, body.history ?? []);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[chat] agent error:', err);
    const detail =
      err instanceof Error ? err.message : 'Unexpected error running the agent.';
    return NextResponse.json(
      { error: `Sorry — something went wrong: ${detail}` },
      { status: 500 },
    );
  }
}
