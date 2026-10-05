const CACHE_PREFIX = "edenfood-site";
const SHELL_CACHE = `${CACHE_PREFIX}-shell-street-199-search-20261005-3`;
const SHELL_URLS = [
  "/",
  "/index.html",
  "/styles.css?v=street-20261005",
  "/storefront.css?v=street-199-search-20261005-2",
  "/menu-search.css?v=street-199-search-20261005",
  "/menu-data.js?v=street-20261005",
  "/extra-menu-data.js?v=street-20261005",
  "/street-menu-data.js?v=street-199-search-20261005",
  "/menu-search.js?v=street-199-search-20261005",
  "/app.js?v=street-199-search-20261005-2",
  "/assets/logo-eden.webp",
  "/assets/snacks/fries.webp",
  "/assets/snacks/cheese-sticks.webp",
  "/assets/snacks/nuggets.webp",
  "/assets/snacks/potato-balls.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirstPage(request) {
  const cache = await caches.open(SHELL_CACHE);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(request, { signal: controller.signal });
    if (response.ok) {
      try {
        await cache.put("/index.html", response.clone());
      } catch {
        /* A full storage quota must not prevent the live page from opening. */
      }
    }
    if (response.status >= 500) {
      return (await cache.match("/index.html")) || response;
    }
    return response;
  } catch {
    return (
      (await cache.match("/index.html")) ||
      new Response(
        "<!doctype html><html lang='ru'><meta charset='utf-8'><meta name='viewport' content='width=device-width'><title>EDEN</title><body style='margin:0;padding:32px;background:#111;color:#fff;font:18px system-ui'><h1>EDEN</h1><p>Сайт временно недоступен. Проверьте интернет и обновите страницу.</p></body></html>",
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      )
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function cacheFirstAsset(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    try {
      await cache.put(request, response.clone());
    } catch {
      /* Serve the live response even if the device has no cache space left. */
    }
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstAsset(request, SHELL_CACHE));
  }
});
