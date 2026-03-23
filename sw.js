// sw.js - Service Worker for GK Store PWA
const CACHE_NAME = 'gk-store-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/css/intlTelInput.css',
  'https://unpkg.com/pocketbase@0.21.0/dist/pocketbase.umd.js',
  'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/intlTelInput.min.js'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching core assets');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
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

// Fetch event - IMPORTANT: Handle video files correctly
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // For video files - use network-first strategy (don't cache videos)
  if (requestUrl.pathname.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
    event.respondWith(
      fetch(event.request).catch(error => {
        console.log('[Service Worker] Video fetch failed, returning error:', error);
        return new Response('Video not available offline', { status: 404 });
      })
    );
    return;
  }
  
  // For PocketBase API calls - always go to network
  if (requestUrl.hostname.includes('trycloudflare.com') || 
      requestUrl.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(error => {
        console.log('[Service Worker] API fetch failed:', error);
        return new Response(JSON.stringify({ error: 'Network error' }), { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // For images and other assets - cache first with network fallback
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request).then(networkResponse => {
        // Don't cache video files
        if (!requestUrl.pathname.match(/\.(mp4|webm|mov)$/i)) {
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
