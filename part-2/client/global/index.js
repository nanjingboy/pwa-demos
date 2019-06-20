import PullToRefresh from 'pulltorefreshjs';

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerSubscriptionSync(registration, tag, subscription) {
  const key = `${tag}-${(new Date().getTime())}`;
  const db = new BackgroundSyncDB();
  await db.add(key, subscription);
  await registration.sync.register(key);
}

async function getSubscription(registration) {
  if ('PushManager' in window) {
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      return subscription;
    }
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(
        'BLW2Nfw3ylyUdwNqAreIPYbemxnxQ7ZTZSIJIHxrgw_xOiUP9enenF5JIHX8KXY8BZpzuGN_0mCehb2XEqms3hg'
      )
    });
    try {
      if ('SyncManager' in window) {
        await registerSubscriptionSync(registration, 'subscribe', subscription);
      } else {
        await Network.subscribe(subscription);
      }
      return subscription;
    } catch (error) {
      subscription.unsubscribe();
      throw error;
    }
  }
  return null;
}

export function initPullToRefresh(onRefresh) {
  PullToRefresh.init({
    mainElement: '.container',
    instructionsPullToRefresh: '下拉刷新',
    instructionsReleaseToRefresh: '释放刷新',
    instructionsRefreshing: '加载中',
    onRefresh,
  });
};

export function renderEmpty() {
  document.querySelector('.container').innerHTML = '<div class="message">暂无任何数据</div>';
};

export async function initSW() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.register('/sw.js').then(
      registration => navigator.serviceWorker.ready
    );
    const subscription = await getSubscription(registration);
    if (subscription) {
      const unsubscribeBtn = document.querySelector('.header > .action-unsubscribe');
      unsubscribeBtn.style.display = 'block';
      unsubscribeBtn.addEventListener('click', () => {
        subscription.unsubscribe();
        unsubscribeBtn.style.display = 'none';
        if ('SyncManager' in window) {
          registerSubscriptionSync(registration, 'unsubscribe', subscription);
        } else {
          Network.unsubscribe(subscription);
        }
      });
    }
    return registration;
  }
}

export function initAppInstall() {
  let appPromptEvent = null;
  let installBtn = document.querySelector('.header > .action-install-app');
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    appPromptEvent = event;
    installBtn.style.display = 'block';
    return false;
  });
  installBtn.addEventListener('click', () => {
    if (appPromptEvent !== null) {
      appPromptEvent.prompt();
      appPromptEvent.userChoice.then(result => {
        if (result.outcome === 'accepted') {
          console.log('同意安装');
        } else {
          console.log('拒绝安装');
        }
        appPromptEvent = null;
      });
    }
  });
  window.addEventListener('appinstalled', () => {
    installBtn.style.display = 'none';
  });
}