self.addEventListener('push', function (event) {
  const data = event.data.json();
  const title = 'Push & Notification Demo';
  console.log('触发通知响应事件：', data);
  if (data.type === 'subscribe') {
    event.waitUntil(
      self.registration.showNotification(title, {
        body: data.message,
        icon: './icon.png',
      })
    );
  } else if (data.type === 'vote') {
    event.waitUntil(
      self.registration.showNotification(title, {
        body: data.message,
        icon: './icon.png',
        actions: [
          { action: 'like', title: '👍 喜欢' },
          { action: 'unlike', title: '👎 不喜欢' }]
      })
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  console.log('触发通知点击事件：');
  if (event.action === 'like') {
    console.log(`你对 ${event.notification.body} 投了赞成票`);
  } else if (event.action === 'unlike') {
    console.log(`你对 ${event.notification.body} 投了反对票`);
  }
});