import { initPullToRefresh, showMessage } from '@/common/global';
import '@/common/global.css';
import './styles.css';

window.onListItemClicked = function(id) {
  window.location.href = `/detail/${id}`;
}

function render(data) {
  if (Array.isArray(data) && data.length > 0) {
    const html = data.reduce((result, item) => {
      result += `<div class="item" onclick="onListItemClicked(${item.id})">
        <div class="title">${item.title}</div>
        <div class="content">${item.content}</div>
        <div class="times">
          <div>首发于：${item.created_at}</div>
          <div>更新于：${item.created_at}</div>
        </div>
      </div>`;
      return result;
    }, '<div class="list">') + '</div>';
    document.querySelector('.container').innerHTML = html;
  } else {
    showMessage('暂无任何数据');
  }
}

window.addEventListener('load', () => {
  setTimeout(() => {
    render([
      {
        id: 1,
        title: '文章标题',
        content: '文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容。',
        created_at: '2019-06-01 12:00:00',
        updated_at: '2019-06-01 12:00:00',
      },
      {
        id: 2,
        title: '文章标题',
        content: '文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容。',
        created_at: '2019-06-01 12:00:00',
        updated_at: '2019-06-01 12:00:00',
      },
      {
        id: 3,
        title: '文章标题',
        content: '文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容。',
        created_at: '2019-06-01 12:00:00',
        updated_at: '2019-06-01 12:00:00',
      }
    ]);
    initPullToRefresh(() => {
      console.log('hello world');
    });
  }, 1000);

  document.querySelector('.side-action').addEventListener('click', () => {
    window.location.href = '/create';
  });
});
