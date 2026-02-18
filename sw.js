const CACHE_NAME = 'gkstore-v1';
const urlsToCache = [
  '/GKStore/index.html',
  '/GKStore/manifest.json',
  '/GKStore/style.css', // your CSS
  '/GKStore/app.js',    // your main JS
  // any other local assets
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Only navigation requests go to index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/GKStore/index.html') || fetch(event.request)
    );
    return;
  }
  event.respondWith(
    caches.match(event.request) || fetch(event.request)
  );
});
