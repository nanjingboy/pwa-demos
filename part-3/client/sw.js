async function fetchPageContent(event) {
  const cacheName = 'page-content';
  try {
    const { request: { url } } = event;
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) {
      const clonePreloadResponse = preloadResponse.clone();
      event.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        await cache.put(url, clonePreloadResponse);
      })());
      return preloadResponse;
    }
  } catch {
  }
  const networkFirst = new workbox.strategies.NetworkFirst({
    cacheName,
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 24 * 60 * 60
      })
    ],
    fetchOptions: {
      headers: {
        'only_content': 1
      }
    }
  })
  return await networkFirst.handle({ event });
}

async function fetchShell(url, type) {
  const { pathname } = new URL(url, location);
  let shellUrl;
  if (pathname === '/') {
    shellUrl = `/shell/home_${type}.html`;
  } else if (/^\/create|\/edit\/\d+$/.test(pathname)) {
    shellUrl = `/shell/edit_${type}.html`;
  } else if (/^\/detail\/\d+$/.test(pathname)) {
    shellUrl = `/shell/detail_${type}.html`;
  }
  const cache = await caches.open(workbox.core.cacheNames.precache);
  return await cache.match(workbox.precaching.getCacheKeyForURL(shellUrl));
}

self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.loadModule('workbox-strategies');
workbox.loadModule('workbox-expiration');

workbox.navigationPreload.enable();

const navigationRoute = new workbox.routing.NavigationRoute(workbox.streams.strategy([
  ({ url }) => fetchShell(url, 'top'),
  ({ event }) => fetchPageContent(event),
  ({ url }) => fetchShell(url, 'bottom')
]));
workbox.routing.registerRoute(navigationRoute);
