const CACHE_NAME = "gk-store-v9";
const APP_SHELL = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/android-launchericon-48-48.png",
  "/android-launchericon-72-72.png",
  "/android-launchericon-96-96.png",
  "/android-launchericon-144-144.png",
  "/android-launchericon-192-192.png",
  "/android-launchericon-512-512.png",
  "/icons/icon-512-maskable.png"
];

const VIDEO_CACHE = "gk-store-videos-v9";

/* =========================
   INSTALL
========================= */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/* =========================
   ACTIVATE
========================= */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (![CACHE_NAME, VIDEO_CACHE].includes(key)) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

/* =========================
   FETCH
========================= */
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const { request } = event;

  // Video requests → network-first + cache
  if (request.destination === "video") {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(VIDEO_CACHE).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // App shell → cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(res => {
        if (!res || res.status !== 200) return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return res;
      }).catch(() => {
        if (request.destination === "document") return caches.match("/index.html");
      });
    })
  );
});
