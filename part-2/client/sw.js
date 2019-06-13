const precacheName = '<%= precacheName %>';
const precacheList = <%- precacheList %>

function getCacheKey(url) {
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

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(precacheName).then(function(cache) {
      return cache.addAll(precacheList);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== precacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  const cacheKey = getCacheKey(event.request.url);
  event.respondWith(caches.match(cacheKey));
});