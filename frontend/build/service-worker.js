const CACHE_NAME = 'smpmps-v2';
const urlsToCache = [
  '/index.html',
  '/manifest.json',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Opened cache');
      // Try to cache files, but don't fail installation if they're missing
      return cache.addAll(urlsToCache).catch(err => {
        console.log('Service Worker: Cache error (non-fatal):', err);
        // Installation continues even if caching fails
      });
    }).catch(err => {
      console.error('Service Worker: Cache open failed:', err);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests (network first)
  if (event.request.url.includes('/api/') || event.request.url.includes(':3001')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('API unavailable', { status: 503 });
      })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Return offline page or cached response
        return caches.match('/index.html');
      });
    })
  );
});

// Background sync for offline submissions (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Sync pending requests with server
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {
        console.log('Sync failed - will retry later');
      })
    );
  }
});
