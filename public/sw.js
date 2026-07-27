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
const SHELL_CACHE = `shell-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const CURRENT = new Set([SHELL_CACHE, ASSET_CACHE, RUNTIME_CACHE]);

/** Enough to boot the app with no network on first offline launch. */
const SHELL = [
  "/",
  "/export",
  "/site.webmanifest",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // Individually, so one 404 can't fail the whole install.
      .then((cache) =>
        Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined))),
      )
      .then(() => self.skipWaiting()),
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

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) ?? (await cache.match("/")) ?? Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(request);

  const update = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  return hit ?? (await update) ?? Response.error();
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

  event.respondWith(staleWhileRevalidate(request));
});

// Lets the page trigger an immediate update instead of waiting for a reload.
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});
