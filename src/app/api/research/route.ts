import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { title, category, brand, model } = await req.json();
    
    if (!title) {
      return NextResponse.json({ error: 'No title provided' }, { status: 400 });
    }

    const { researchPrice } = await import('@/lib/ai');
    const result = await researchPrice(title, category || '', brand || '', model || '');
    
    return NextResponse.json({ success: true, research: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Research failed';
    console.error('Research error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 60;
