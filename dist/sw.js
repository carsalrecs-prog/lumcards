const CACHE_NAME = 'lumcards-cache-20260919-drive-oauth-r7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.css?v=20260918-studio-workspace-r2',
  '/student.css?v=20260918-studio-workspace-r2',
  '/app.js?v=20260919-drive-oauth-r6',
  '/client-startup.js?v=20260919-drive-oauth-r7',
  '/card-runtime.js',
  '/vendor/katex/katex.min.js',
  '/vendor/katex/katex.min.css',
  '/vendor/katex/contrib/auto-render.min.js',
  '/vendor/katex/fonts/KaTeX_AMS-Regular.woff2',
  '/vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2',
  '/vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2',
  '/vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2',
  '/vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2',
  '/vendor/katex/fonts/KaTeX_Main-Bold.woff2',
  '/vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2',
  '/vendor/katex/fonts/KaTeX_Main-Italic.woff2',
  '/vendor/katex/fonts/KaTeX_Main-Regular.woff2',
  '/vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2',
  '/vendor/katex/fonts/KaTeX_Math-Italic.woff2',
  '/vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2',
  '/vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2',
  '/vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2',
  '/vendor/katex/fonts/KaTeX_Script-Regular.woff2',
  '/vendor/katex/fonts/KaTeX_Size1-Regular.woff2',
  '/vendor/katex/fonts/KaTeX_Size2-Regular.woff2',
  '/vendor/katex/fonts/KaTeX_Size3-Regular.woff2',
  '/vendor/katex/fonts/KaTeX_Size4-Regular.woff2',
  '/vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2',

  '/sync-manager.js?v=20260919-drive-oauth-r6',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/practice.html',
  '/practice.css?v=20260918-studio-workspace-r2',
  '/practice.js?v=20260918-studio-workspace-r2',
  '/study-games.js?v=20260918-studio-workspace-r2'
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
