const CACHE_NAME = 'gkstore-v1';
const urlsToCache = [
  '/GKStore/',
  '/GKStore/index.html',
  '/GKStore/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/@supabase/supabase-js@2.39.7/dist/umd/supabase.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});