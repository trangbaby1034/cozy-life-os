/* Cozy Life OS – service worker: cho app chạy offline.
   MỖI LẦN SỬA APP: tăng VERSION để điện thoại nhận bản mới. */
const VERSION = 'cozy-2026.11.17-2';
const SHELL = [
  './', './index.html', './app.js', './db.js', './backup.js', './manifest.webmanifest',
  './fonts/fonts.css',
  './fonts/quicksand-vietnamese-wght-normal.woff2', './fonts/quicksand-latin-ext-wght-normal.woff2', './fonts/quicksand-latin-wght-normal.woff2',
  './fonts/nunito-vietnamese-wght-normal.woff2', './fonts/nunito-latin-ext-wght-normal.woff2', './fonts/nunito-latin-wght-normal.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    if (req.mode === 'navigate') {
      return (await cache.match('./index.html')) || fetch(req);
    }
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      return new Response('', { status: 504 });
    }
  })());
});
