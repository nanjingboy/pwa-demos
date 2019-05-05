importScripts('./db.js');
importScripts('./network.js');

function notification(todos) {
  self.clients.matchAll().then(function(clients) {
    if (clients && clients.length) {
      clients.forEach(function(client) {
        client.postMessage(todos);
      });
    }
  });
}

self.addEventListener('sync', function(event) {
  if (event.tag === 'add-todo') {
    console.log(`开始进行后台同步：${event.tag}`);
    event.waitUntil(
      db.getTodos().then(function(todos) {
        return network.addTodos(todos).then(function(todos) {
          console.log('来自服务器的响应：', todos);
          notification(todos);
          return db.clearTodos();
        });
      })
    );
  }
});