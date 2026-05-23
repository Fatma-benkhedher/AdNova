// sw.js — Service Worker standalone
// DOIT être un fichier séparé, pas dans player.html

const CACHE_NAME = 'adplayer-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne pas mettre en cache les endpoints dynamiques
  if (
    url.pathname === '/latest_video' ||
    url.pathname === '/video' ||
    url.pathname === '/upload_frame' ||
    url.pathname === '/update_status' ||
    url.pathname === '/camera_stream'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Pour le reste : network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
