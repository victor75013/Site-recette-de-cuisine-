const CACHE_NAME = 'carnet-recettes-v50';

// Fichiers de base pré-mis en cache
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './Image mobile/book-open.png',
  './Image mobile/globe.png',
  './Image mobile/arrow-down-to-line.png',
  './Image mobile/settings.png',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/pages.css',
  './js/config.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(err => {
      console.warn('[SW] Pré-cache partiel:', err);
    }))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Ignorer les requêtes d'API internes ou externes
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/scrape') || url.pathname.startsWith('/translate')) {
    return;
  }
  // Ignorer Firebase Firestore/Auth
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebaseio.com') || url.hostname.includes('gstatic.com')) {
    return;
  }

  // 1. Navigation HTML : Stratégie Network-First avec fallback Cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // 2. Assets statiques (CSS, JS, images) de même origine : Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
