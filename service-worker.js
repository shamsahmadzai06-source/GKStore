// Service Worker for GK Store
const CACHE_NAME = 'gk-store-v1';
const CACHE_VERSION = 'v1.0.0';
const CACHE_FILES = [
  '/',
  '/index.html',
  '/android-launchericon-192-192.png',
  '/android-launchericon-512-512.png',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/@supabase/supabase-js@2'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(CACHE_FILES)
          .then(() => {
            console.log('[Service Worker] All files cached successfully');
          })
          .catch(error => {
            console.error('[Service Worker] Failed to cache files:', error);
          });
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...');
  
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
  
  // Claim clients immediately
  return self.clients.claim();
});

// Fetch event - network first, then cache fallback
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For Supabase API requests, use network only
  if (event.request.url.includes('supabase.co')) {
    return;
  }
  
  // For HTML pages, try network first, then cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, return offline page
              return caches.match('/');
            });
        })
    );
    return;
  }
  
  // For static assets, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Update cache in background
          fetch(event.request)
            .then(response => {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            })
            .catch(() => {
              // Network request failed, keep cached version
            });
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Network failed, check if it's an image
            if (event.request.headers.get('Accept').includes('image')) {
              // Return a placeholder image for failed image requests
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#18181b"/><text x="100" y="100" font-family="Arial" font-size="14" fill="#a1a1aa" text-anchor="middle" dominant-baseline="middle">Image not available</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            
            // For other failed requests
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Push notification event
self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  
  let data = {
    title: 'GK Store',
    body: 'You have new updates!',
    icon: 'android-launchericon-192-192.png',
    badge: 'android-launchericon-192-192.png'
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }
  
  const options = {
    body: data.body || 'New content is available!',
    icon: data.icon || 'android-launchericon-192-192.png',
    badge: data.badge || 'android-launchericon-192-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: 'android-launchericon-192-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: 'android-launchericon-192-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'GK Store', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-book-requests') {
    event.waitUntil(syncBookRequests());
  }
});

// Sync book requests when online
async function syncBookRequests() {
  console.log('[Service Worker] Syncing book requests...');
  // This is where you would sync any pending requests when back online
}

// Periodic background sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  console.log('[Service Worker] Updating content periodically...');
  // Update content in background
}