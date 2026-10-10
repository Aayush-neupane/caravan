// Wattle & Wander offline fallback. Same-origin GETs (documents, chunks,
// styles, images) are cached as browsed; navigations try the network first
// and fall back to the cached /offline page instead of the browser's
// default offline game. API/XHR traffic is network-only and never cached.
// Registered in production builds only (see SwRegister) — dev chunk URLs
// change on every recompile and must never be cached.
// Bump CACHE to ship a fresh worker + fallback.
const CACHE = "ww-offline-v4";
const FALLBACKS = ["/offline", "/"]; // each cached independently; one may fail while the other lands

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        Promise.all(FALLBACKS.map((u) => c.add(u).catch(() => {})))
      )
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
  // Never touch the API: /api/calendar, quotes and RSC payloads must stay
  // live — a cached availability answer would let two guests book one van.
  if (new URL(request.url).pathname.startsWith("/api/")) return;
  const isDocument = request.mode === "navigate" || request.destination === "document";
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
        if (isDocument) {
          for (const u of FALLBACKS) {
            const fallback = await caches.match(u);
            if (fallback) return fallback;
          }
        }
        throw new Error("offline");
      })
  );
});
