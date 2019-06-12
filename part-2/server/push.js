
const db = require('./db');
const webpush = require('web-push');

function setup() {
  webpush.setVapidDetails(
    'mailto:hzlhu.dargon@gmail.com',
    'BLW2Nfw3ylyUdwNqAreIPYbemxnxQ7ZTZSIJIHxrgw_xOiUP9enenF5JIHX8KXY8BZpzuGN_0mCehb2XEqms3hg',
    'LBj1P1XVRmIir5zxSAGQMvLdwxC87hU6tZYJzxO6NQ4'
  );
  return Promise.resolve();
}

async function sendMessage(data) {
  const pushSubscriptions = await db.getPushSubscriptions();
  if (Array.isArray(pushSubscriptions)) {
    pushSubscriptions.forEach(pushSubscription => {
      sendMessageWithSubscription(
        data,
        {
          endpoint: pushSubscription.endpoint,
          keys: {
            auth: pushSubscription.auth,
            p256dh: pushSubscription.p256dh,
          }
        }
      );
    });
  }
}

function sendMessageWithSubscription(data, subscription) {
  webpush.sendNotification(
    subscription,
    JSON.stringify(data),
    { proxy: 'http://127.0.0.1:1087' }
  ).then(response => {
    console.log('\nThe data send successfully:', JSON.stringify(data));
  }).catch(error => {
    console.log('\nThe data send failed:', error);
  });
}

module.exports = {
  setup,
  sendMessage,
  sendMessageWithSubscription
}