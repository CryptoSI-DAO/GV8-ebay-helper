import { NextRequest, NextResponse } from 'next/server';

// Password protection middleware — blocks all unauthenticated access
const PASSWORD = process.env.APP_PASSWORD || '';
const COOKIE_NAME = 'gv8-auth';
const AUTH_PATH = '/api/auth';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Allow auth endpoint through
  if (pathname === AUTH_PATH) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icon-') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.json')
  ) {
    // But block manifest.json from leaking app info to unauthenticated users
    if (pathname === '/manifest.json') {
      const cookie = request.cookies.get(COOKIE_NAME)?.value;
      if (cookie === PASSWORD) return NextResponse.next();
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return NextResponse.next();
  }

  // Check auth cookie
  const cookie = request.cookies.get(COOKIE_NAME)?.value;

  if (cookie === PASSWORD && PASSWORD) {
    return NextResponse.next();
  }

  // API routes get 401
  if (pathname.startsWith('/api/')) {
    return new NextResponse(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Page requests get the login page
  return new NextResponse(getLoginPage(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

function getLoginPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GV8 eBay Helper</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #111111;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 380px;
      text-align: center;
    }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .brand { color: #e7f900; }
    .sub { color: #666; font-size: 14px; margin-bottom: 28px; }
    input {
      width: 100%;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #333;
      background: #111;
      color: #fff;
      font-size: 16px;
      outline: none;
      margin-bottom: 12px;
    }
    input:focus { border-color: #e7f900; }
    button {
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      border: none;
      background: #e7f900;
      color: #111;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: #d4e000; }
    .error { color: #f44; font-size: 13px; margin-top: 12px; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1><span class="brand">GV8</span> eBay Helper</h1>
    <p class="sub">Enter password to continue</p>
    <form id="form">
      <input type="password" id="pw" placeholder="Password" autofocus autocomplete="current-password" />
      <button type="submit">Enter</button>
    </form>
    <p class="error" id="err">Incorrect password</p>
  </div>
  <script>
    document.getElementById('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = document.getElementById('pw').value;
      const err = document.getElementById('err');
      err.style.display = 'none';
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pw }),
        });
        if (res.ok) {
          window.location.reload();
        } else {
          err.style.display = 'block';
          document.getElementById('pw').value = '';
          document.getElementById('pw').focus();
        }
      } catch {
        err.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
}

export const config = {
  matcher: ['/((?!_next/static|favicon.ico).*)'],
};
