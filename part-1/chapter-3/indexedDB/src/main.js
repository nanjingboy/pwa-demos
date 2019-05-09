function open() {
  const openRequest = window.indexedDB.open('TodoList', 1);
  openRequest.onupgradeneeded = function(event) {
    const db = event.target.result;
    const todosStore = db.createObjectStore('todos', { keyPath: 'id', autoIncrement : true });
    todosStore.createIndex('status', 'status');
  };
  return openRequest;
}

function removeAll() {
  open().onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['todos'], 'readwrite');
    transaction.oncomplete = function() {
      document.getElementById('list').innerHTML = '';
    };
    transaction.objectStore('todos').clear();
  };
}

function add(detail) {
  open().onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['todos'], 'readwrite');
    transaction.oncomplete = function() {
      filter('all');
    };
    transaction.objectStore('todos').add({ detail: detail, status: 'doing' });
  };
}

function update(id, currentStatus) {
  open().onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['todos'], 'readwrite');
    transaction.oncomplete = function() {
      filter('all');
    };
    const todosStore = transaction.objectStore('todos');
    const result = todosStore.get(id);
    result.onsuccess = function(event) {
      const record = event.target.result;
      record.status = currentStatus === 'doing' ? 'completed' : 'doing';
      todosStore.put(record);
    };
  };
}

function filter(type) {
  open().onsuccess = function(event) {
    let html = '';
    const db = event.target.result;
    const transaction = db.transaction(['todos'], 'readonly');
    transaction.oncomplete = function() {
      document.getElementById('list').innerHTML = html;
    };
    const todosStore = transaction.objectStore('todos');
    const query = type === 'all' ? null : IDBKeyRange.only(type);
    const result = todosStore.index('status').openCursor(query);
    result.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
        const record = cursor.value;
        html += `<div class="item ${record.status}" onclick="update(${record.id}, '${record.status}')">${record.detail}（#${record.id}）</div>`;
        cursor.continue();
      }
    }
  };
}
