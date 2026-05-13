const CACHE_NAME = 'zangochap-manager-v2';
const ASSETS_TO_CACHE = [
  '/zangochap-manager',
  '/zangochap-manager/dashboard',
  '/zangochap-manager/logistics/packing',
  '/zangochap-manager/logistics/collection',
  '/manifest.json',
  '/logo.png',
  '/logo-mobile.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If fetch fails and no cache, return the offline shell
        if (event.request.mode === 'navigate') {
          return caches.match('/zangochap-manager');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
