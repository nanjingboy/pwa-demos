class DB {
  constructor(name, version, onupgradeneeded) {
    this._db = null;
    this._name = name;
    this._version = version;
    this._onupgradeneeded = onupgradeneeded;
  }

  async _open() {
    if (this._db !== null) {
      return;
    }
    this._db = await new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(this._name, this._version);
      openRequest.onerror = () => reject(openRequest.error);
      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onupgradeneeded = event => {
        if (typeof this._onupgradeneeded === 'function') {
          this._onupgradeneeded(event);
        }
      };
    });
  }

  async _transaction(storeNames, mode, callback) {
    await this._open();
    return await new Promise((resolve, reject) => {
      const transaction = this._db.transaction(storeNames, mode);
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
      callback(transaction, value => resolve(value));
    });
  }

  async _call(method, storeName, mode, ...args) {
    const callback = (transaction, done) => {
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore[method].apply(objectStore, args);
      request.onsuccess = () => done(request.result);
    }
    return await this._transaction([storeName], mode, callback);
  }

  async read(method, storeName, ...args) {
    return await this._call(method, storeName, 'readonly', ...args);
  }

  async write(method, storeName, ...args) {
    return await this._call(method, storeName, 'readwrite', ...args);
  }
}

class BackgroundSyncDB extends DB {
  constructor() {
    super('BackgroundSync', 1, event => {
      const db = event.target.result;
      const objectStore = db.createObjectStore('BackgroundSync', { keyPath: 'tag' });
      objectStore.createIndex('tag', 'tag', { unique: true });
    });
  }

  add(tag, value) {
    return this.write('add', 'BackgroundSync', {
      tag,
      value: JSON.parse(JSON.stringify(value))
    });
  }

  get(tag) {
    return this.read('get', 'BackgroundSync', tag);
  }

  delete(tag) {
    return this.write('delete', 'BackgroundSync', tag);
  }
}

class CacheExpirationDB extends DB {
  constructor(cacheName, maxAgeSeconds) {
    super('CacheExpiration', 1, event => {
      const db = event.target.result;
      const objStore = db.createObjectStore('CacheExpiration', { keyPath: 'id' });
      objStore.createIndex('timestamp', 'timestamp', { unique: false });
    });
    this._cacheName = cacheName;
    this._maxAgeSeconds = maxAgeSeconds;
  }

  async set(url, timestamp) {
    const expireEntries = await this.expireEntries(timestamp);
    await this.write('put', 'CacheExpiration', {
      id: this._getId(url),
      cacheName: this._cacheName,
      url: this._normalizeURL(url),
      timestamp
    });
    return expireEntries;
  }

  async expireEntries(timestamp) {
    const minTimestamp = timestamp - this._maxAgeSeconds;
    const entriesToDelete = await this._transaction(
      'CacheExpiration', 'readonly', (transaction, done) => {
        const entriesToDelete = [];
        const store = transaction.objectStore('CacheExpiration');
        const result = store.index('timestamp').openCursor(null, 'prev');
        result.onsuccess = ({ target }) => {
          const cursor = target.result;
          if (cursor) {
            const record = cursor.value;
            if (record.cacheName === this._cacheName && record.timestamp < minTimestamp) {
              entriesToDelete.push(record);
            }
            cursor.continue();
          } else {
            done(entriesToDelete);
          }
        };
      }
    );

    const urlsDeleted = [];
    for (const entry of entriesToDelete) {
      await this.write('delete', 'CacheExpiration', entry.id);
      urlsDeleted.push(entry.url);
    }
    return urlsDeleted;
  }

  _normalizeURL(baseUrl) {
    const url = new URL(baseUrl, location);
    url.hash = '';
    return url.pathname;
  }

  _getId(url) {
    return `${this._cacheName}|${this._normalizeURL(url)}`;
  }
}
