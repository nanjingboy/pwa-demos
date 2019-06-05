
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

async function push(data) {
  const pushSubscriptions = await db.getPushSubscriptions();
  if (Array.isArray(pushSubscriptions)) {
    pushSubscriptions.forEach(pushSubscription => {
      webpush.sendNotification(
        {
          endpoint: pushSubscription.endpoint,
          keys: {
            auth: pushSubscription.auth,
            p256dh: pushSubscription.p256dh,
          }
        },
        JSON.stringify(data),
        { proxy: 'http://127.0.0.1:1087' }
      ).then(response => {
        console.log(`\n Sent data to ${pushSubscription.id} successfully:`, JSON.stringify(data));
      }).catch(error => {
        console.log(`\n Sent data to ${pushSubscription.id} failed:`, error);
      });
    });
  }
}

module.exports = {
  setup,
  push,
}