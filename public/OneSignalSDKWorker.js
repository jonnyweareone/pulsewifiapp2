// OneSignal SDK import - MUST be first line
// Using try-catch to handle potential CDN failures
try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
  console.log('[SW] OneSignal SDK loaded successfully');
} catch (e) {
  console.error('[SW] Failed to load OneSignal SDK:', e);
}

// PWA Caching
const CACHE_NAME = 'pulse-wifi-v3';
const STATIC_CACHE = 'pulse-static-v3';
const DYNAMIC_CACHE = 'pulse-dynamic-v3';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v3...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets failed to cache:', err);
        // Don't fail install if some assets aren't available
        return Promise.resolve();
      });
    })
  );
  // Take control immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v3...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => {
            // Remove old versioned caches
            return (key.startsWith('pulse-') && 
                    key !== STATIC_CACHE && 
                    key !== DYNAMIC_CACHE);
          })
          .map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API routes - always go to network
  if (url.pathname.startsWith('/api/')) return;

  // Skip auth routes - always go to network  
  if (url.pathname.startsWith('/auth/')) return;

  // Skip OneSignal requests - let their SDK handle it
  if (url.hostname.includes('onesignal.com')) return;

  // Skip Supabase requests
  if (url.hostname.includes('supabase.co')) return;

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) return;

  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Try cache, then offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline');
          });
        })
    );
    return;
  }

  // For other assets (JS, CSS, images)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached, but also fetch and update cache in background
        fetch(request).then((response) => {
          if (response.status === 200) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, response);
            });
          }
        }).catch(() => {});
        return cached;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch((err) => {
        console.error('[SW] Fetch failed:', err);
        // Return a basic offline response for failed requests
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

// Background sync for heartbeat
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'heartbeat-sync') {
    event.waitUntil(
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'from-service-worker',
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => {
        console.error('[SW] Heartbeat sync failed:', err);
      })
    );
  }
});

// Push event handling (OneSignal handles this, but we can add custom logic)
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  // OneSignal SDK handles push display, but we log for debugging
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();
  
  // Open app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});

console.log('[SW] Service worker script loaded');
