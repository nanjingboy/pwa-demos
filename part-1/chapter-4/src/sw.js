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

let retryTimes = 1;
self.addEventListener('sync', function(event) {
  if (event.tag === 'add-todo') {
    const date = new Date();
    console.log(`开始进行后台同步：${event.tag}`);
    console.log(`第 ${retryTimes++} 次同步：${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`);
    if (event.lastChance) {
      console.log('这是最后一次尝试哦^ _ ^');
    }
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