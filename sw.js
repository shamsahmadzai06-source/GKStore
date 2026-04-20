// GK Store Service Worker
const CACHE_NAME = 'gk-store-v2';
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'backr.png',
  'android-launchericon-72-72.png',
  'android-launchericon-96-96.png',
  'android-launchericon-144-144.png',
  'android-launchericon-192-192.png',
  'android-launchericon-512-512.png'
];

// Install event - cache core files
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.log('Cache failed:', err))
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
