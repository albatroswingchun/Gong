/* ═══════════════════════════════════════════
   GŌNG — Service Worker (PWA)
═══════════════════════════════════════════ */

const CACHE_NAME = 'gong-v3';

const ASSETS = [
  '/Gong/',
  '/Gong/index.html',
  '/Gong/style.css',
  '/Gong/app.js',
  '/Gong/manifest.json',
  '/Gong/icons/icon-192.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.origin.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
