/**
 * Service worker for the timetable PWA.
 *
 * This is a static site people check daily, often on a phone on campus with
 * patchy signal, so the priorities are: open instantly, work with no network,
 * and still pick up a new deploy without anyone having to clear storage.
 *
 * Three strategies, picked per request type:
 *
 *   navigations      network-first, falling back to cache. A deploy lands on
 *                    the next online visit; offline still opens the last-seen
 *                    page rather than the browser error.
 *   /_next/static/*  cache-first, never revalidated. These filenames contain a
 *                    content hash, so a given URL's bytes can never change —
 *                    revalidating them would be pure latency. This is also
 *                    what makes the lazily-loaded allocation index free after
 *                    its first fetch.
 *   everything else  stale-while-revalidate: serve the cached copy at once,
 *                    refresh it in the background for next time.
 */

const VERSION = "v1";
/**
 * `sw.js` is served unchanged across deploys, so `activate` — and therefore the
 * cache-name sweep below — effectively runs once ever. That means the hashed
 * asset cache would otherwise grow by a whole build on every deploy until the
 * origin hits quota pressure and the browser evicts the app wholesale, taking
 * offline support with it. Capping entries bounds it regardless of deploy count.
 */
const MAX_ASSET_ENTRIES = 120;
const SHELL_CACHE = `shell-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const CURRENT = new Set([SHELL_CACHE, ASSET_CACHE, RUNTIME_CACHE]);

/** Without this the installed app cannot open offline at all. */
const REQUIRED_SHELL = ["/"];

/** Nice to have cached, but not worth failing the install over. */
const OPTIONAL_SHELL = [
  "/export",
  "/site.webmanifest",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Let this reject: activating with no cached document would leave an
      // installed app that simply doesn't open offline, which is worse than
      // retrying the install.
      await cache.addAll(REQUIRED_SHELL);
      await Promise.all(
        OPTIONAL_SHELL.map((url) => cache.add(url).catch(() => undefined)),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !CURRENT.has(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Oldest-first eviction; Cache API keys() preserves insertion order. */
async function trim(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(
    keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)),
  );
}

// Every write below is awaited, or handed to waitUntil. An un-awaited
// cache.put() races the worker being terminated once respondWith settles, which
// silently leaves the cache unpopulated — the exact failure that makes offline
// support flaky rather than broken, and so the hardest to notice.
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    await trim(cache, MAX_ASSET_ENTRIES);
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match("/")) ?? Response.error();
  }
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(request);

  const update = (async () => {
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch {
      return undefined;
    }
  })();

  if (hit) {
    // Serve now, refresh for next time — but keep the worker alive until the
    // write lands, or the "revalidate" half never happens.
    event.waitUntil(update);
    return hit;
  }
  return (await update) ?? Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, event));
});

// Lets the page trigger an immediate update instead of waiting for a reload.
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});
