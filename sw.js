/* ============================================================================
 * WORD-MAPPING SERVICE WORKER (PWA & OFFLINE CACHE ENGINE)
 * ============================================================================
 * Complies strictly with RULES-CORE-002:
 * - 100% self-contained: Only caches local relative assets.
 * - Zero external network calls or remote dependencies.
 * - Cache-First strategy provides instant zero-latency cold starts.
 * ============================================================================
 */

const CACHE_NAME = 'word-mapping-v1.2.0';

// Core local assets required for full offline playability
const PRECACHE_ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'icon.svg'
];

/* --------------------------------------------------------------------------
 * Install Event: Pre-cache core shell & activate immediately
 * -------------------------------------------------------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache all local game files
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // Force the waiting service worker to become active
      return self.skipWaiting();
    })
  );
});

/* --------------------------------------------------------------------------
 * Activate Event: Clean up legacy caches & claim clients
 * -------------------------------------------------------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((existingCache) => {
          if (existingCache !== CACHE_NAME) {
            // Delete obsolete cached versions
            return caches.delete(existingCache);
          }
        })
      );
    }).then(() => {
      // Become active on all current tabs without waiting for a reload
      return self.clients.claim();
    })
  );
});

/* --------------------------------------------------------------------------
 * Fetch Event: Cache-First strategy for ultra-fast offline response
 * -------------------------------------------------------------------------- */
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin resources
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return instant response from local cache
        return cachedResponse;
      }

      // If not in cache, fetch from local host and opportunistically store in cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback to index.html if navigating offline
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
