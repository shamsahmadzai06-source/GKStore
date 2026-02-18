const CACHE_NAME = 'gkstore-v1';

const CORE_ASSETS = [
  '/GKStore/',
  '/GKStore/index.html',
  '/GKStore/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Required for Android TWA
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/GKStore/index.html')
        .then(res => res || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(res => res || fetch(event.request))
  );
});
