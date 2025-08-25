// ARK Dumpster Admin Service Worker
const CACHE_NAME = 'ark-admin-v1.0.0';
const STATIC_CACHE = 'ark-static-v1';
const DYNAMIC_CACHE = 'ark-dynamic-v1';
const API_CACHE = 'ark-api-v1';

// Files to cache on install
const STATIC_ASSETS = [
  '/admin',
  '/admin/orders', 
  '/admin/quotes',
  '/admin/dumpsters',
  '/manifest.json',
  '/ark-logo.svg'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/orders',
  '/api/quotes', 
  '/api/storage-list'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - cache first
  static: [
    '/',
    '/admin',
    '/manifest.json',
    '/ark-logo.svg'
  ],
  
  // Dynamic content - network first with fallback
  dynamic: [
    '/admin/',
    '/_next/static/'
  ],
  
  // API calls - network first with cache fallback
  api: [
    '/api/'
  ],
  
  // Images - cache first with network fallback
  images: [
    '.jpg',
    '.jpeg', 
    '.png',
    '.svg',
    '.webp'
  ]
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // API requests - Network first with cache fallback
    if (pathname.startsWith('/api/')) {
      return await networkFirstStrategy(request, API_CACHE);
    }
    
    // Static assets - Cache first
    if (isStaticAsset(pathname)) {
      return await cacheFirstStrategy(request, STATIC_CACHE);
    }
    
    // Images - Cache first with network fallback  
    if (isImageRequest(pathname)) {
      return await cacheFirstStrategy(request, DYNAMIC_CACHE);
    }
    
    // Admin routes - Network first with cache fallback
    if (pathname.startsWith('/admin')) {
      return await networkFirstWithOfflineFallback(request);
    }
    
    // Next.js assets - Cache first
    if (pathname.startsWith('/_next/')) {
      return await cacheFirstStrategy(request, STATIC_CACHE);
    }
    
    // Default: Network first
    return await networkFirstStrategy(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return await getOfflineFallback();
    }
    
    return new Response('Network error', { status: 503 });
  }
}

// Cache first strategy
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Optionally update cache in background
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network first strategy
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Network first with offline fallback for admin routes
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for admin route, checking cache');
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for admin routes
    return await getOfflineFallback();
  }
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail background updates
    console.log('[SW] Background cache update failed:', error);
  }
}

// Get offline fallback page
async function getOfflineFallback() {
  const cache = await caches.open(STATIC_CACHE);
  const offlinePage = await cache.match('/admin');
  
  if (offlinePage) {
    return offlinePage;
  }
  
  // Create minimal offline response
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ARK Admin - Offline</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
            color: #333;
            text-align: center;
            padding: 20px;
          }
          .container {
            max-width: 400px;
            background: white;
            padding: 40px 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          p {
            margin: 0 0 20px 0;
            color: #666;
            line-height: 1.5;
          }
          button {
            background: #007AFF;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
          }
          button:hover {
            background: #0051D0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📱</div>
          <h1>You're offline</h1>
          <p>The ARK Admin dashboard is available offline with limited functionality. Your changes will sync when you're back online.</p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Helper functions
function isStaticAsset(pathname) {
  return CACHE_STRATEGIES.static.some(asset => pathname === asset || pathname.startsWith(asset));
}

function isImageRequest(pathname) {
  return CACHE_STRATEGIES.images.some(ext => pathname.toLowerCase().includes(ext));
}

function isAPIRequest(pathname) {
  return CACHE_STRATEGIES.api.some(path => pathname.startsWith(path));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'ark-offline-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  try {
    // This would communicate with the offline sync hook
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_ACTIONS'
      });
    });
  } catch (error) {
    console.error('[SW] Offline sync error:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/ark-logo.svg',
      badge: '/ark-logo.svg',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.urgent || false,
      tag: data.tag || 'ark-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('[SW] Push notification error:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  let url = '/admin';
  
  if (data && data.url) {
    url = data.url;
  } else if (event.action === 'view-orders') {
    url = '/admin/orders';
  } else if (event.action === 'view-quotes') {
    url = '/admin/quotes';
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      
      // Open new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(cacheNames => 
          Promise.all(cacheNames.map(name => caches.delete(name)))
        )
      );
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

console.log('[SW] Service worker loaded successfully');