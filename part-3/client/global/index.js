
import toastr from 'toastr';
import { Workbox } from 'workbox-window/Workbox.mjs';
import 'toastr/build/toastr.min.css';

const defaultToastOptions = {
  ...toastr.options,
  positionClass: 'toast-top-center',
  timeOut: 1000,
  extendedTimeOut: 0
};

function showSwUpdateTip(workbox) {
  toast(
    'info',
    '页面已更新，请点击此处进行更新',
    {
      timeOut: 0,
      onHidden: () => {
        workbox.messageSW({ type: 'SKIP_WAITING' });
      }
    }
  );
}

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
      await fetchWrapper('/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription)
      });
      return subscription;
    } catch (error) {
      subscription.unsubscribe();
      throw error;
    }
  }
  return null;
}

export function fetchWrapper(url, options) {
  return fetch(url, {
    ...options,
    headers: {
      'content-type': 'application/json'
    }
  }).then(async response => {
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  })
}

export async function initSW() {
  if ('serviceWorker' in navigator) {
    const workbox = new Workbox('/sw.js');
    workbox.addEventListener('waiting', event => {
      showSwUpdateTip(workbox);
    });
    workbox.addEventListener('externalwaiting', event => {
      showSwUpdateTip(workbox);
    });

    workbox.addEventListener('activated', event => {
      if (event.isUpdate) {
        toast('success', '页面更新完毕，即将刷新页面', {
          onHidden: () => {
            window.location.reload();
          }
        });
      }
    });
    workbox.addEventListener('externalactivated', event => {
      toast('success', '页面更新完毕，即将刷新页面', {
        onHidden: () => {
          window.location.reload();
        }
      });
    });
    const registration = await workbox.register({ immediate: true });
    const subscription = await getSubscription(registration);
    if (subscription) {
      const unsubscribeBtn = document.querySelector('.header > .action-unsubscribe');
      unsubscribeBtn.style.display = 'block';
      unsubscribeBtn.addEventListener('click', () => {
        subscription.unsubscribe();
        unsubscribeBtn.style.display = 'none';
        fetchWrapper('/subscribe', {
          method: 'DELETE',
          body: JSON.stringify(subscription)
        });
      });
    }
    return workbox;
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

export function toast(type, message, options = {}) {
  toastr.remove();
  Object.assign(toastr.options, defaultToastOptions, options);
  toastr[type](message);
}