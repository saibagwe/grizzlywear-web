import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL;
    if (!aiServiceUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_AI_SERVICE_URL not configured' }, { status: 500 });
    }

    const upstream = await fetch(`${aiServiceUrl}/ai/visual-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: imageUrl.trim() }),
      cache: 'no-store',
    });

    let payload: any = null;
    try {
      payload = await upstream.json();
    } catch {
      payload = { error: 'Invalid response from AI service' };
    }

    if (!upstream.ok) {
      const detail = payload?.detail || payload?.error || 'Visual search failed';
      return NextResponse.json({ error: detail }, { status: upstream.status });
    }

    return NextResponse.json(payload);

  } catch (error: any) {
    console.error('[/api/visual-search]', error);
    return NextResponse.json(
      { error: error.message || 'Visual search failed' },
      { status: 500 }
    );
  }
}
