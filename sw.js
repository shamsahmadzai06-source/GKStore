// sw.js - Service Worker with version control
const CACHE_NAME = 'gk-store-v2'; // Increment this when you make changes
const STATIC_ASSETS = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/css/intlTelInput.css',
  'https://unpkg.com/pocketbase@0.21.0/dist/pocketbase.umd.js',
  'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/intlTelInput.min.js',
  'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Claim clients immediately
      self.clients.claim(),
      // Delete old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Fetch event - network first, then cache
self.addEventListener('fetch', event => {
  // Skip cross-origin requests except CDNs
  const url = new URL(event.request.url);
  
  // For API calls and dynamic content - always go to network
  if (url.pathname.includes('/api/') || 
      url.hostname.includes('trycloudflare.com') ||
      event.request.url.includes('pocketbase')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For static assets - network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request);
      })
  );
});

// Handle messages from client
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
