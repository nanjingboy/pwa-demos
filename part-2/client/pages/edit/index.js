import { initSW, initAppInstall, registerSync } from '@/global';
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import '@/global/index.css';
import './styles.css';

toastr.options = {
  ...toastr.options,
  positionClass: 'toast-bottom-center',
  timeOut: 1000,
  extendedTimeOut: 0
};

let isOnline = true;
let currentRecordId = null;

function onSave(callback) {
  const title = document.querySelector('.container > .input > .title').value.trim();
  const content = document.querySelector('.container > .input > .content').value.trim();
  if (title.length === 0 || content.length === 0) {
    toastr.error('标题与正文均不能为空');
  } else {
    callback(title, content);
  }
}

function onArticleResponse(status) {
  if (status) {
    toastr.options.onHidden = () => {
      toastr.options.onHidden = null;
      window.location.href = '/';
    };
    toastr.success('操作成功，稍后将自动跳转页面');
  } else {
    toastr.error('操作失败');
  }
}

function showOfflineTip() {
  if (isOnline) {
    return;
  }
  toastr.info('当前网络不可用，请求已加入后台同步序列');
}

window.addEventListener('online', () => isOnline = true);
window.addEventListener('offline', () => isOnline = false);

window.addEventListener('load', () => {
  initSW().then(registration => {
    navigator.serviceWorker.addEventListener('message', event => {
      const { type, status } = event.data;
      if (type === 'saveArticle' || type === 'deleteArticle') {
        onArticleResponse(status);
      }
    });
    document.querySelector('.container > .actions > .save').addEventListener('click', () => {
      onSave((title, content) => {
        const data = {
          id: currentRecordId,
          key: currentRecordId ? null : (new Date()).getTime(),
          title,
          content
        };
        if ('SyncManager' in window) {
          registerSync(registration, 'saveArticle', data);
          showOfflineTip();
        } else {
          Network.saveArticle(data).then(() => {
            onArticleResponse(true);
          }).catch(() => {
            onArticleResponse(false);
          });
        }
      });
    });

    document.querySelector('.container > .actions > .delete').addEventListener('click', () => {
      const data = { id: currentRecordId };
      if ('SyncManager' in window) {
        registerSync(registration, 'deleteArticle', data);
        showOfflineTip();
      } else {
        Network.deleteArticle(data).then(() => {
          onArticleResponse(true);
        }).catch(() => {
          onArticleResponse(false);
        });
      }
    });
  });
  initAppInstall();
  const { pathname } = window.location;
  if (/^\/edit\/\d+$/.test(pathname)) {
    currentRecordId = pathname.match(/(\d+)/)[0];
    document.querySelector('.container > .actions > .delete').style.display = 'block';
    Network.getArticle(currentRecordId).then(response => {
      if (response) {
        document.querySelector('.container > .input > .title').value = response.title;
        document.querySelector('.container > .input > .content').value = response.content;
      }
    });
  }
});
