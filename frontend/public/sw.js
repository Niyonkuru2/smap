// Enhanced Service Worker for SMPMPS
// Provides offline functionality, caching strategies, and background sync

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `smpmps-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `smpmps-dynamic-${CACHE_VERSION}`;
const API_CACHE = `smpmps-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `smpmps-images-${CACHE_VERSION}`;

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache for offline access
const CACHEABLE_API_ROUTES = [
  '/products',
  '/markets',
  '/categories',
  '/prices'
];

// Cache duration in milliseconds
const CACHE_DURATION = {
  api: 5 * 60 * 1000,      // 5 minutes for API data
  static: 24 * 60 * 60 * 1000, // 24 hours for static assets
  images: 7 * 24 * 60 * 60 * 1000 // 7 days for images
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Static cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('smpmps-') && 
                     name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE &&
                     name !== API_CACHE &&
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api') || url.port === '3001' || CACHEABLE_API_ROUTES.some(route => url.pathname.includes(route))) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Handle image requests with cache-first strategy
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Handle static assets with stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Network-first strategy (for API calls)
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Clone and cache the response
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    // Return cached API data if available
    return new Response(JSON.stringify({ error: 'Offline', cached: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cache-first strategy (for images)
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Check if cache is still valid
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Image fetch failed:', request.url);
    // Return a placeholder image or empty response
    return new Response('', { status: 404 });
  }
}

// Stale-while-revalidate strategy (for static assets)
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(cacheName).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
      }
      return networkResponse;
    })
    .catch(() => {
      return cachedResponse || caches.match('/offline.html');
    });
  
  return cachedResponse || fetchPromise;
}

// Background sync for offline submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'price-submission') {
    event.waitUntil(syncPriceSubmissions());
  }
  
  if (event.tag === 'offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync price submissions when back online
async function syncPriceSubmissions() {
  try {
    const db = await openIndexedDB();
    const submissions = await getAllPendingSubmissions(db);
    
    for (const submission of submissions) {
      try {
        const response = await fetch('/api/prices/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': submission.authToken
          },
          body: JSON.stringify(submission.data)
        });
        
        if (response.ok) {
          await deletePendingSubmission(db, submission.id);
          // Notify user
          self.registration.showNotification('Price Submitted', {
            body: `Your price for ${submission.data.productName} has been submitted.`,
            icon: '/icon-192.png'
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync submission:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Sync generic offline actions
async function syncOfflineActions() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE' });
  });
}

// IndexedDB helpers for offline data
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('smpmps-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-submissions')) {
        db.createObjectStore('pending-submissions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cached-prices')) {
        db.createObjectStore('cached-prices', { keyPath: 'id' });
      }
    };
  });
}

function getAllPendingSubmissions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-submissions'], 'readonly');
    const store = transaction.objectStore('pending-submissions');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deletePendingSubmission(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-submissions'], 'readwrite');
    const store = transaction.objectStore('pending-submissions');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const data = event.data?.json() || {
    title: 'SMPMPS Update',
    body: 'New price information available',
    icon: '/icon-192.png'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: data.actions || [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Focus existing window or open new one
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_PRICES') {
    cacheApiData(event.data.url);
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }
});

async function cacheApiData(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put(url, response);
    }
  } catch (error) {
    console.error('[SW] Failed to cache API data:', error);
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

console.log('[SW] Service Worker loaded');
