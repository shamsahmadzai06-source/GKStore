const CACHE_NAME = 'gkstore-v1';
const urlsToCache = [
  '/GKStore/',
  '/GKStore/index.html',
  '/GKStore/manifest.json',
  '/GKStore/android-launchericon-72-72.png',
  '/GKStore/android-launchericon-96-96.png',
  '/GKStore/android-launchericon-144-144.png',
  '/GKStore/android-launchericon-192-192.png',
  '/GKStore/android-launchericon-512-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/css/intlTelInput.css',
  'https://unpkg.com/pocketbase@0.21.0/dist/pocketbase.umd.js',
  'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/intlTelInput.min.js',
  'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js'
];

// Install service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - CRITICAL: NEVER cache or intercept API calls
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // IMPORTANT: Skip ALL requests to your VPS IP - let them pass through normally
  if (url.includes('216.126.225.4')) {
    // Do NOT try to cache, do NOT intercept - just pass through to network
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For static assets only, try cache first
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
