import PullToRefresh from 'pulltorefreshjs';

export function initPullToRefresh(onRefresh) {
  PullToRefresh.init({
    mainElement: '.container',
    instructionsPullToRefresh: '下拉刷新',
    instructionsReleaseToRefresh: '释放刷新',
    instructionsRefreshing: '加载中',
    onRefresh,
  });
};

export function showMessage(message) {
  let html = '';
  if (typeof message === 'string' && message.trim().length > 0) {
    html = `<div class="message">${message}</div>`
  }
  document.querySelector('.container').innerHTML = html;
};

export function initSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}