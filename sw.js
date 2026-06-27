const CACHE_NAME = 'carnet-recettes-v14';

// Fichiers mis en cache pour le mode hors-ligne
const APP_SHELL = ['./index.html', './css/style.css', './js/data.js', './js/recipes.js', './js/nutrition.js', './js/form.js', './js/importer.js', './js/sites.js', './js/app.js', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
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
  const url = new URL(event.request.url);

  // Ignorer les requêtes vers d'autres origines (Firebase, Google Fonts, etc.)
  if (url.origin !== self.location.origin) return;
  // Ignorer le serveur de dev
  if (url.port === '3001') return;

  // TOUT est Network First : on va toujours chercher la dernière version sur le serveur.
  // Le cache ne sert que de fallback quand on est hors-ligne.
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Hors-ligne : on sert depuis le cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Si c'est une navigation (page HTML), renvoyer index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
