/* Service Worker — Programa Scout PWA
   Cachea el app-shell y los datos para funcionar sin conexión.
   Sube CACHE_VERSION cuando cambien archivos para forzar actualización. */
const CACHE_VERSION = "programa-scout-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/styles.css",
  "./assets/app.js",
  "./icons/icon.svg",
  "./data/capas.json",
  "./data/conceptos.json",
  "./data/situaciones.json",
  "./data/rutas.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Estrategia: stale-while-revalidate para datos y shell.
   Sirve rápido desde caché y actualiza en segundo plano. */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            cache.put(request, resp.clone());
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
