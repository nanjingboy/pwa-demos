import { toast, initSW } from '@/global';
import '@/global/index.css';
import './styles.css';

let currentRecordId = null;

function onSave(callback) {
  const title = document.querySelector('.container > .input > .title').value.trim();
  const content = document.querySelector('.container > .input > .content').value.trim();
  if (title.length === 0 || content.length === 0) {
    toast('error', '标题与正文均不能为空');
  } else {
    callback(title, content);
  }
}

function onArticleResponse(status) {
  if (status) {
    toast('success', '操作成功，稍后将自动跳转页面', {
      onHidden: () => {
        window.location.href = '/';
      }
    });
  } else {
    toast('error', '操作失败');
  }
}

window.addEventListener('load', () => {
  const { pathname } = window.location;
  if (/^\/edit\/\d+$/.test(pathname)) {
    currentRecordId = pathname.match(/(\d+)/)[0];
  }
  document.querySelector('.container > .actions > .save').addEventListener('click', () => {
    onSave((title, content) => {
      const data = {
        id: currentRecordId,
        key: currentRecordId ? null : (new Date()).getTime(),
        title,
        content
      };
      Network.saveArticle(data).then(() => {
        onArticleResponse(true);
      }).catch(() => {
        onArticleResponse(false);
      });
    });
  });
  if (currentRecordId) {
    document.querySelector('.container > .actions > .delete').addEventListener('click', () => {
      const data = { id: currentRecordId };
      Network.deleteArticle(data).then(() => {
        onArticleResponse(true);
      }).catch(() => {
        onArticleResponse(false);
      });
    });
  }
  initSW();
});
