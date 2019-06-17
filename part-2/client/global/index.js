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