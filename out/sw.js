// ProCheff Service Worker - v1.0.0
// Cache-first strategy for offline functionality

const CACHE_NAME = 'procheff-v1.0.0';
const STATIC_CACHE = 'procheff-static-v1.0.0';
const RUNTIME_CACHE = 'procheff-runtime-v1.0.0';

// Define what to cache during install
const PRECACHE_URLS = [
  '/ProCheff-New/',
  '/ProCheff-New/dashboard/',
  '/ProCheff-New/ihale/',
  '/ProCheff-New/ihale/analiz/',
  '/ProCheff-New/ihale/kik-analiz/',
  '/ProCheff-New/ihale/offer/',
  '/ProCheff-New/ihale/rapor/',
  '/ProCheff-New/menu/',
  '/ProCheff-New/menu/adaptor/',
  '/ProCheff-New/menu/simulasyon/',
  '/ProCheff-New/menu/trend/',
  '/ProCheff-New/menu/fiyat-takip/',
  '/ProCheff-New/admin/',
  '/ProCheff-New/admin/ai-settings/',
  '/ProCheff-New/upload/',
  '/ProCheff-New/offer/',
  '/ProCheff-New/reports/',
  '/ProCheff-New/manifest.json',
  '/ProCheff-New/robots.txt',
  '/ProCheff-New/sitemap.xml'
];

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('[ProCheff SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[ProCheff SW] Caching static resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[ProCheff SW] Static resources cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ProCheff SW] Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ProCheff SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE) {
              console.log('[ProCheff SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ProCheff SW] Service worker activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle ProCheff routes
  if (url.pathname.startsWith('/ProCheff-New/')) {
    event.respondWith(
      cacheFirst(request)
        .catch(() => {
          // If cache and network fail, return offline page
          if (request.destination === 'document') {
            return createOfflinePage();
          }
          throw new Error('Network and cache failed');
        })
    );
  }
});

// Cache-first strategy
async function cacheFirst(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[ProCheff SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Fallback to network
    console.log('[ProCheff SW] Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[ProCheff SW] Cache-first strategy failed:', error);
    throw error;
  }
}

// Create offline fallback page
function createOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ProCheff - Çevrimdışı</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Inter', sans-serif; 
          background: #0E0F13; 
          color: #ffffff; 
          height: 100vh; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          flex-direction: column;
        }
        .offline-container { 
          text-align: center; 
          padding: 2rem;
          max-width: 500px;
        }
        .offline-icon { 
          font-size: 4rem; 
          margin-bottom: 1rem; 
          opacity: 0.7;
        }
        .offline-title { 
          font-size: 2rem; 
          font-weight: 600; 
          margin-bottom: 1rem; 
          color: #ffffff;
        }
        .offline-message { 
          font-size: 1.1rem; 
          color: #999999; 
          margin-bottom: 2rem; 
          line-height: 1.6;
        }
        .retry-button { 
          background: #1a1b23; 
          border: 1px solid #333333; 
          color: #ffffff; 
          padding: 12px 24px; 
          border-radius: 8px; 
          font-size: 1rem; 
          cursor: pointer; 
          transition: all 0.2s;
        }
        .retry-button:hover { 
          background: #2a2b33; 
          border-color: #555555;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1 class="offline-title">Çevrimdışı</h1>
        <p class="offline-message">
          İnternet bağlantısı bulunamadı. ProCheff'in bazı özellikleri önbellekten kullanılabilir.
        </p>
        <button class="retry-button" onclick="window.location.reload()">
          Tekrar Dene
        </button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Background sync for data when connection returns
self.addEventListener('sync', event => {
  console.log('[ProCheff SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'procheff-data-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('[ProCheff SW] Syncing offline data...');
    // Here you would implement offline data synchronization
    // This could include form submissions, user preferences, etc.
    console.log('[ProCheff SW] Offline data sync completed');
  } catch (error) {
    console.error('[ProCheff SW] Offline data sync failed:', error);
  }
}

// Push notifications (for future use)
self.addEventListener('push', event => {
  console.log('[ProCheff SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'ProCheff bildirimi',
    icon: '/ProCheff-New/icon-192.png',
    badge: '/ProCheff-New/icon-192.png',
    tag: 'procheff-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Aç'
      },
      {
        action: 'close',
        title: 'Kapat'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ProCheff', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[ProCheff SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/ProCheff-New/')
    );
  }
});

console.log('[ProCheff SW] Service worker loaded successfully');
