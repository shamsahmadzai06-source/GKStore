// sw.js - Service Worker for GK Store PWA
const CACHE_NAME = 'gk-store-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/css/intlTelInput.css',
  'https://unpkg.com/pocketbase@0.21.0/dist/pocketbase.umd.js',
  'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/intlTelInput.min.js'
];

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // For video files - network-first strategy (don't cache videos)
  if (url.pathname.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
    event.respondWith(
      fetch(event.request).catch(error => {
        console.log('[Service Worker] Video fetch failed');
        return new Response('Video not available', { status: 404 });
      })
    );
    return;
  }
  
  // For PocketBase API calls - always network-first
  if (url.hostname.includes('trycloudflare.com') || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(error => {
        console.log('[Service Worker] API fetch failed');
        return new Response(JSON.stringify({ error: 'Network error' }), { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // For images and static assets - cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        // Don't cache video files
        if (!url.pathname.match(/\.(mp4|webm|mov)$/i)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
