import toastr from 'toastr';
import 'toastr/build/toastr.min.css';

const defaultToastOptions = {
  ...toastr.options,
  positionClass: 'toast-top-center',
  timeOut: 1000,
  extendedTimeOut: 0
};

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
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  }
}

export function toast(type, message, options = {}) {
  toastr.remove();
  Object.assign(toastr.options, defaultToastOptions, options);
  toastr[type](message);
}