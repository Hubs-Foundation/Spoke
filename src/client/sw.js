const CACHE_NAME = "hubs.mozilla.com/spoke";

self.addEventListener("fetch", event => {
  event.respondWith(createResponse(event.request));
});

async function createResponse(request) {
  const { origin, pathname } = new URL(request.url);

  if (
    request.method === "GET" &&
    origin === location.origin &&
    (pathname.startsWith("/api/media") || pathname.startsWith("/api/farspark"))
  ) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    } else {
      const networkResponse = await fetch(request);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  }

  return fetch(request);
}
