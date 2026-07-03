const CACHE = 'gv8-v1';
const ASSETS = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// Install — pre-cache the app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for pages (so auth/login always works), never cache API
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never intercept API calls — always hit the network
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests: try network first, fall back to cached shell
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets: cache-first
  if (ASSETS.includes(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
  }
});
