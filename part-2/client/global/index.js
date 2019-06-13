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

export function renderEmpty() {
  document.querySelector('.container').innerHTML = '<div class="message">暂无任何数据</div>';
};

export function initSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}