const CACHE = "gkstore-v1";

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./android-launchericon-72-72.png",
  "./android-launchericon-96-96.png",
  "./android-launchericon-144-144.png",
  "./android-launchericon-192-192.png",
  "./android-launchericon-512-512.png"
];

// Install Event
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
