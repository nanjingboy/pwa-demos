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
  const cache = await cache.open(cacheName);
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

async function fetchArticles(request) {
  const networkTimeoutPromise = new Promise(resolve => {
    setTimeout(async () => {
      resolve(await getCache(runtimeCacheName, '/articles'))
    }, 3000);
  });
  const networkPromise = (async () => {
    try {
      const response = await fetch(request.clone());
      if (response) {
        await setCache(runtimeCacheName, '/articles', response.clone());
      }
      return response;
    } catch {
      return await getCache(runtimeCacheName, '/articles');
    }
  })();
  return await Promise.race([networkPromise, networkTimeoutPromise]);
}

async function fetchArticle(request) {
  let articles = [];
  const cachedResponse = await getCache(runtimeCacheName, '/articles');
  if (cachedResponse) {
    try {
      articles = await cachedResponse.json();
      if (Array.isArray(articles) && articles.length > 0) {
        const id = request.url.match(/(\d+)$/)[0];
        const article = articles.find(article => parseInt(article.id, 10) === parseInt(id, 10));
        if (article) {
          return new Response(
            new Blob([JSON.stringify(article)], { type : 'application/json' }),
            {
              status: 200,
              statusText: 'OK'
            }
          );
        }
      }
    } catch {
    }
  }

  const response = await fetch(request.clone());
  if (response.status === 200) {
    articles.push(await response.clone().json());
    if (articles.length > 1) {
      articles.sort((a, b) => {
        const keyA = new Date(a.updated_at);
        const keyB = new Date(b.updated_at);
        if (keyA > keyB) {
          return -1;
        }
        if (keyA < keyB) {
          return 1;
        }
        return 0;
      });
    }
    await setCache(
      runtimeCacheName,
      '/articles',
      new Response(
        new Blob([JSON.stringify(articles)], { type : 'application/json' }),
        {
          status: 200,
          statusText: 'OK'
        }
      )
    );
  }
  return response;
}

async function fetchAssets(event) {
  let cacheKey;
  const { pathname } = new URL(event.request.url, location);
  if (pathname === '/') {
    cacheKey = '/index.html';
  } else if (/^\/create|\/edit\/\d+$/.test(pathname)) {
    cacheKey = '/edit.html';
  } else if (/^\/detail\/\d+$/.test(pathname)) {
    cacheKey = '/detail.html';
  } else {
    cacheKey = pathname;
  }

  const cachedResponse = await getCache(precacheName, cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const preloadResponse = await event.preloadResponse;
  if (preloadResponse) {
    await setCache(precacheName, cacheKey, preloadResponse.clone());
    return preloadResponse;
  }

  const networkResponse = await fetch(cacheKey);
  if (networkResponse) {
    await setCache(precacheName, cacheKey, networkResponse.clone());
  }
  return networkResponse;
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
      if (/\/articles\/?$/.test(request.url)) {
        return await fetchArticles(request);
      }

      if (/\/articles\/\d+\/?$/.test(request.url)) {
        return await fetchArticle(request);
      }

      return await fetchAssets(event);
    })());
  }
});