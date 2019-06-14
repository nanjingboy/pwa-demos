const precacheName = '<%= precacheName %>';
const precacheList = <%- precacheList %>

function parseNavigateCacheKey(url) {
  const { pathname } = new URL(url, location);
  if (pathname === '/') {
    return '/index.html';
  }
  if (/^\/create|\/edit\/\d+$/.test(pathname)) {
    return '/edit.html';
  }
  if (/^\/detail\/\d+$/.test(pathname)) {
    return '/detail.html';
  }
  return pathname;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(precacheName);
    await cache.addAll(precacheList);
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    const cacheNames = await caches.keys();
    cacheNames.filter(
      cacheName => cacheName !== precacheName
    ).forEach(async cacheName => await caches.delete(cacheName));
  })());
});

self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    let cacheKey
    let preloadFetch
    if (event.request.mode === 'navigate') {
      cacheKey = parseNavigateCacheKey(event.request.url);
      preloadFetch = event.preloadResponse;
    } else {
      cacheKey = event.request.url;
      preloadFetch = Promise.resolve(undefined);
    }
    const cachedResponse = await caches.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
    const preloadResponse = await preloadFetch;
    if (preloadResponse) {
      return preloadResponse;
    }
    return await fetch(event.request.clone());
  })());
});