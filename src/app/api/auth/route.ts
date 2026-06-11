import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = process.env.APP_PASSWORD || '';
const COOKIE_NAME = 'gv8-auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password !== PASSWORD || !PASSWORD) {
      return new NextResponse(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
