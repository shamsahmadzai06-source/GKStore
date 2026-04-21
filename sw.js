const CACHE_NAME = 'gk-store-v4';
const urlsToCache = [
  '.', 'index.html', 'manifest.json',
  'android-launchericon-72-72.png', 'android-launchericon-96-96.png',
  'android-launchericon-144-144.png', 'android-launchericon-192-192.png',
  'android-launchericon-512-512.png'
];

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))); });
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key))))); });
