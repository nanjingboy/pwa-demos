import { toast, initSW, fetchWrapper } from '@/global';
import '@/global/index.css';
import './styles.css';

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
    if (navigator.onLine) {
      toast('error', '操作失败');
    } else {
      toast('info', '当前网络不可用，请求已加入后台同步序列');
    }
  }
}

function saveArticle(article) {
  const { id } = article;
  if (id) {
    return fetchWrapper(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(article)
    });
  }

  return fetchWrapper('/articles', {
    method: 'POST',
    body: JSON.stringify(article)
  });
}

function deleteArticle(data) {
  return fetch(`/articles/${data.id}`, {
    method: 'DELETE',
  });
}

window.addEventListener('load', () => {
  let currentRecordId = null;
  const { pathname } = window.location;
  if (/^\/edit\/\d+$/.test(pathname)) {
    currentRecordId = pathname.match(/(\d+)/)[0];
  }

  const workboxChannel = new BroadcastChannel('workbox');
  workboxChannel.addEventListener('message',  event => {
    const { type, payload } = event.data;
    if (type === 'BACKGROUND_SYNC') {
      onArticleResponse(payload.status);
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
      saveArticle(data).then(() => {
        onArticleResponse(true);
      }).catch(() => {
        onArticleResponse(false);
      });
    });
  });
  if (currentRecordId) {
    document.querySelector('.container > .actions > .delete').addEventListener('click', () => {
      const data = { id: currentRecordId };
      deleteArticle(data).then(() => {
        onArticleResponse(true);
      }).catch(() => {
        onArticleResponse(false);
      });
    });
  }
  initSW();
});
