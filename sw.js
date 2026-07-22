const CACHE_NAME = "phasmo-ghost-id-v10";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./data/ghosts.json",
  "./icons/logo-192.png",
  "./icons/logo-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-16x16.png",
  "./icons/favicon-32x32.png",
  "./icons/favicon.ico",
  "./icons/logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate: serve from cache for instant offline-capable
// loads, but always re-fetch in the background and update the cache, so
// a deploy is picked up on the next launch without a CACHE_NAME bump.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const refetch = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
      if (cached) {
        refetch.catch(() => {}); // offline: keep serving the cached copy
        return cached;
      }
      return refetch;
    })
  );
});
