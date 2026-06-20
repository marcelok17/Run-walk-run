const CACHE_NAME = 'trote-paso-v1';
const APP_SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first para el shell de la app (HTML/manifest/íconos), red normal para todo lo demás
// (mosaicos de mapas, fuentes, GPS no aplica) para que siempre estén actualizados.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isShell = APP_SHELL.some(p => url.pathname.endsWith(p.replace('./','')));
  if (event.request.method !== 'GET') return;
  if (isShell) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((resp) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resp.clone()));
          return resp;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
