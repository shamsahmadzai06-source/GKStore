// GK Store Service Worker
const CACHE_NAME = 'gkstore-v1';
const API_CACHE_NAME = 'gkstore-api-v1';

// Assets to cache on install
const urlsToCache = [
  '/GKStore/',
  '/GKStore/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network with offline support
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Handle API requests (Supabase)
  if (requestUrl.hostname.includes('supabase.co')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle static assets (CSS, JS, fonts, images)
  if (event.request.url.match(/\.(css|js|woff2|png|jpg|jpeg|gif|svg)$/)) {
    event.respondWith(handleStaticRequest(event.request));
    return;
  }
  
  // Handle HTML pages and everything else
  event.respondWith(handlePageRequest(event.request));
});

// Handle API requests (network first, cache fallback)
async function handleApiRequest(request) {
  try {
    // Try network first for API
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    console.log('Network failed for API, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API
    return new Response(
      JSON.stringify({ error: 'You are offline. Please check your connection.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle static assets (cache first, network fallback)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Static asset fetch failed:', request.url);
    return new Response('', { status: 404 });
  }
}

// Handle page requests (network first with offline page)
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful page responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for page, trying cache:', request.url);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try cached index.html as fallback
    const indexResponse = await caches.match('/GKStore/');
    if (indexResponse) {
      return indexResponse;
    }
    
    // Return simple offline page
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - GK Store</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #000;
              color: #fff;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              text-align: center;
              padding: 20px;
            }
            .offline-container {
              max-width: 400px;
            }
            .offline-icon {
              font-size: 64px;
              margin-bottom: 20px;
              color: #ec4899;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
              background: linear-gradient(135deg, #ec4899, #8b5cf6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            p {
              color: #a1a1aa;
              line-height: 1.6;
            }
            .retry-btn {
              background: linear-gradient(135deg, #ec4899, #8b5cf6);
              color: white;
              border: none;
              padding: 12px 30px;
              border-radius: 30px;
              font-size: 16px;
              font-weight: 600;
              margin-top: 20px;
              cursor: pointer;
            }
            .retry-btn:hover {
              transform: scale(1.05);
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1>You're Offline</h1>
            <p>GK Store needs an internet connection to load content. Please check your connection and try again.</p>
            <button class="retry-btn" onclick="window.location.reload()">Retry Connection</button>
          </div>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Background sync for offline actions (optional)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-bookings') {
    console.log('Background sync triggered');
    // You can add code here to sync pending bookings when back online
  }
});

// Push notification handling (optional)
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/GKStore/android-launchericon-192-192.png',
    badge: '/GKStore/android-launchericon-72-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/GKStore/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('GK Store', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
