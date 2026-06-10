const CACHE_NAME = 'carnet-recettes-v14';
const APP_SHELL = [
  '/', '/index.html', '/manifest.json',
  '/css/theme.css', '/css/base.css', '/css/layout.css', '/css/components.css',
  '/css/components/tabs.css', '/css/components/toolbar.css', '/css/components/recipe-card.css',
  '/css/components/modal.css', '/css/components/form.css', '/css/components/buttons.css',
  '/css/components/import.css', '/css/components/settings.css', '/css/components/toasts.css',
  '/css/components/sites.css',
  '/js/core/data.js', '/js/core/importer.js',
  '/js/views/recipes.js', '/js/views/form.js', '/js/views/sites.js',
  '/js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.port === '3001' || url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.status === 200) { const clone = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)); }
        return response;
      }).catch(() => { if (event.request.mode === 'navigate') return caches.match('/index.html'); });
    })
  );
});
