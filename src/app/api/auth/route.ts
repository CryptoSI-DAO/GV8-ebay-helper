import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = process.env.APP_PASSWORD || '';
const COOKIE_NAME = 'gv8-auth';

// Simple in-memory rate limiter (per serverless instance)
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const attempts = new Map<string, { count: number; firstAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return false;
  }

  record.count++;
  if (record.count > MAX_ATTEMPTS) {
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // Rate limit check
  if (isRateLimited(ip)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many attempts. Try again in 15 minutes.' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { password } = await req.json();

    if (!password || password !== PASSWORD || !PASSWORD) {
      return new NextResponse(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clear rate limiter on successful auth
    attempts.delete(ip);

    const response = NextResponse.json({ success: true });

    // Set cookie — httpOnly, secure, 30 day expiry
    response.cookies.set(COOKIE_NAME, PASSWORD, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return new NextResponse(JSON.stringify({ error: 'Bad request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
