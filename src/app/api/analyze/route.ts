import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const { analyzeImage } = await import('@/lib/ai');
    const result = await analyzeImage(image);
    
    return NextResponse.json({ success: true, analysis: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    console.error('Analysis error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 60;
