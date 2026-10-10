// Hartley & Moor offline fallback. Navigations try the network first; on
// failure the cached /offline page (bare dusk drive) serves instead of the
// browser's default offline game. API/XHR requests are never intercepted.
// Bump CACHE to ship a fresh fallback.
const CACHE = "hm-offline-v1";
const FALLBACK = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add(FALLBACK))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Documents only: let APIs, images and other subresources fail naturally.
  if (request.method !== "GET" || request.mode !== "navigate") return;
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && new URL(request.url).origin === self.location.origin) {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((c) => c.put(request, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(FALLBACK).then((fallback) => fallback || Response.error())
      )
  );
});
