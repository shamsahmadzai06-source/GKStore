const CACHE_NAME = 'gk-store-v3';
const STATIC_CACHE = 'gk-static-v3';
const STATIC_ASSETS = [
  '/', '/index.html', '/manifest.json', '/backr.png',
  '/android-launchericon-72-72.png', '/android-launchericon-96-96.png',
  '/android-launchericon-144-144.png', '/android-launchericon-192-192.png',
  '/android-launchericon-512-512.png'
];

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))); });
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key !== STATIC_CACHE && caches.delete(key))))); });
