const CACHE_NAME = 'gkstore-v2';
const APP_SHELL = [
  '/GKStore/index.html',
  '/GKStore/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/GKStore/index.html')
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});
