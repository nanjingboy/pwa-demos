importScripts(...<%- importScripts %>);

const runtimeCacheName = 'runtime-cache';
const precacheName = '<%= precacheName %>';
const precacheList = <%- precacheList %>;

const maxAgeSeconds = {
  [precacheName]: 60 * 60 * 24 * 7 * 1000, // 1 week
  [runtimeCacheName]: 60 * 60 * 24 * 1000 // 1 day
};

async function updateCacheExpirations(cacheName, cacheKey = null) {
  const db = new CacheExpirationDB(cacheName);
  const minTimestamp = Date.now() - maxAgeSeconds[cacheName];
  if (cacheKey) {
    await db.update(cacheKey, minTimestamp);
  }
  const deletedKeys = await db.expireEntries(minTimestamp);
  const cache = await caches.open(cacheName);
  for (const deletedKey of deletedKeys) {
    await cache.delete(deletedKey);
  }
}

async function getCache(cacheName, cacheKey) {
  const cache = await caches.open(cacheName);
  return await cache.match(cacheKey);
}

async function setCache(cacheName, cacheKey, value) {
  const cache = await caches.open(cacheName);
  try {
    await cache.put(cacheKey, value);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      await updateCacheExpirations(precacheName);
      await updateCacheExpirations(runtimeCacheName);
    }
    throw error;
  }
  await updateCacheExpirations(cacheName, cacheKey);
}

async function postMessage(message) {
  const clients = await self.clients.matchAll();
  if (clients && clients.length > 0) {
    clients.forEach(client => client.postMessage(message));
  }
}

async function fetchAssets(cacheKey, event) {
  const cachedResponse = await getCache(precacheName, cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(cacheKey);
  if (networkResponse) {
    const cloneResponse = networkResponse.clone();
    event.waitUntil((async () => {
      await setCache(precacheName, cacheKey, cloneResponse);
    })());
  }
  return networkResponse;
}

async function fetchPageContent(cacheKey, event) {
  try {
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) {
      const clonePreloadResponse = preloadResponse.clone();
      event.waitUntil((async () => {
        await setCache(runtimeCacheName, cacheKey, clonePreloadResponse);
      })());
      return preloadResponse;
    }
  } catch {
  }
  const networkTimeoutPromise = new Promise(resolve => {
    setTimeout(async () => {
      resolve(await getCache(runtimeCacheName, cacheKey))
    }, 3000);
  });
  const networkPromise = (async () => {
    try {
      const response = await fetch(cacheKey, {
        headers: {
          'only_content': 1
        }
      });
      if (response) {
        const cloneResponse = response.clone();
        event.waitUntil((async () => {
          await setCache(runtimeCacheName, cacheKey, cloneResponse);
        })());
      }
      return response;
    } catch {
      return await getCache(runtimeCacheName, cacheKey);
    }
  })();
  return await Promise.race([networkPromise, networkTimeoutPromise]);
}

function fetchPage(cacheKey, event) {
  let shellType;
  if (cacheKey === '/') {
    shellType = 'home';
  } else if (/^\/create|\/edit\/\d+$/.test(cacheKey)) {
    shellType = 'edit';
  } else if (/^\/detail\/\d+$/.test(cacheKey)) {
    shellType = 'detail';
  }

  const stream = new ReadableStream({
    start(controller) {
      function pushStream(stream) {
        const reader = stream.getReader();
        function read() {
          return reader.read().then(result => {
            if (result.done) {
              return;
            }
            controller.enqueue(result.value);
            return read();
          });
        }
        return read();
      }

      (async () => {
        const top = await getCache(precacheName, `/shell/${shellType}_top.html`);
        await pushStream(top.body);

        const content = await fetchPageContent(cacheKey, event);
        if (content) {
          await pushStream(content.body);
        } else {
          const errorContent = new Response(
            '<div class="message">网络错误</div>',
            { headers: { 'Content-Type': 'text/html' } }
          );
          await pushStream(errorContent.body);
        }

        const bottom = await getCache(precacheName, `/shell/${shellType}_bottom.html`);
        await pushStream(bottom.body);
        controller.close();
      })();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' }
  });
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(precacheName);
    await cache.addAll(precacheList);
    const precacheExpirationDB = new CacheExpirationDB(precacheName);
    for (const precacheItem of precacheList) {
      await precacheExpirationDB.update(precacheItem, Date.now());
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      if (cacheName !== precacheName && /^precache\-\d+$/.test(cacheName)) {
        await caches.delete(cacheName);
        await (new CacheExpirationDB(cacheName)).expireEntries(Infinity);
      }
    }
  })());
});

self.addEventListener('push', event => {
  const data = event.data.json();
  const title = 'PWA 博文';
  if (data.type === 'subscribe' || data.type === 'article') {
    event.waitUntil(
      self.registration.showNotification(title, {
        data,
        body: data.message,
        icon: '/launcher-icon.png',
      })
    );
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const { notification: { data } } = event;
  if (data.type === 'article' && data.id) {
    self.clients.openWindow(`/detail/${data.id}`);
  }
});

self.addEventListener('sync', event => {
  const { tag } = event;
  event.waitUntil((async () => {
    const db = new BackgroundSyncDB();
    if (!event.lastChance) {
      const result = await db.get(tag);
      if (result) {
        const type = tag.replace(/\-\d+$/g, '');
        if (typeof Network[type] === 'function') {
          try {
            await Network[type](result.value);
            postMessage({ type, status: true });
          } catch (error) {
            postMessage({ type, status: false });
            throw error;
          }
        }
      }
    }
    await db.delete(tag);
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method.toLowerCase() === 'get') {
    event.respondWith((async () => {
      const cacheKey = new URL(request.url, location).pathname;
      if (precacheList.includes(cacheKey)) {
        return await fetchAssets(cacheKey, event);
      }
      return fetchPage(cacheKey, event);
    })());
  }
});