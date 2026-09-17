const CACHE_NAME = 'lumcards-cache-library-20260917-web-study-blocks';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.css?v=20260917-web-study-blocks',
  '/student.css?v=20260917-web-study-blocks',
  '/app.js?v=20260917-web-study-blocks',
  '/card-runtime.js',
  '/sync-manager.js',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/practice.html',
  '/practice.css?v=20260917-web-study-blocks',
  '/practice.js?v=20260917-web-study-blocks',
  '/study-games.js?v=20260917-web-study-blocks'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // No interceptar llamadas externas ni auth
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/media/')) return;

  // El HTML debe venir de la instalación actual cuando el servidor está disponible.
  // Así una actualización no queda atrapada por una portada cacheada antigua.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cached || caches.match('/index.html'));
      
      return cached || fetchPromise;
    })
  );
});
