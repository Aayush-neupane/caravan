// Hartley & Moor offline fallback. Same-origin GETs (documents, chunks,
// styles, images) are cached as browsed; navigations try the network first
// and fall back to the cached /offline page (bare dusk drive) instead of the
// browser's default offline game. API/XHR traffic is network-only.
// Bump CACHE to ship a fresh worker + fallback.
const CACHE = "hm-offline-v2";
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
  if (request.method !== "GET") return;
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((c) => c.put(request, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await caches.match(FALLBACK);
          if (fallback) return fallback;
        }
        throw new Error("offline");
      })
  );
});
