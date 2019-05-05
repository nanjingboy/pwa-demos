const db = {

  _instance: null,

  _getDB() {
    if (db._instance == null) {
      db._instance = new Promise(function(resolve, reject) {
        const openRequest = indexedDB.open('TodoBackgroundSync', 1);
        openRequest.onerror = function(event) {
          reject(event.target.error);
        };
        openRequest.onupgradeneeded = function(event) {
          event.target.result.createObjectStore('todos', { autoIncrement : true });
        };
        openRequest.onsuccess = function(event) {
          resolve(event.target.result);
        };
      });
    }
    return db._instance;
  },

  _transaction(mode, callback) {
    return db._getDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        const transaction = db.transaction(['todos'], mode);
        transaction.oncomplete = function() {
          resolve();
        };
        transaction.onerror = function(event) {
          reject(event.target.error);
        };
        callback(transaction.objectStore('todos'));
      });
    });
  },

  getTodos() {
    const todos = [];
    return db._transaction('readonly', function(store) {
      const result = store.openCursor();
      result.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
          todos.push(cursor.value);
          cursor.continue();
        }
      }
    }).then(function() {
      return todos;
    });
  },

  addTodo(name) {
    return db._transaction('readwrite', function(store) {
      store.add({ name: name });
    });
  },

  clearTodos() {
    return db._transaction('readwrite', function(store) {
      store.clear();
    });
  }
};