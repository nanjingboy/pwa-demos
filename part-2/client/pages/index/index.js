import { initSW, initAppInstall, renderEmpty } from '@/global';
import '@/global/index.css';
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
    renderEmpty();
  }
}

window.addEventListener('load', () => {
  initSW();
  initAppInstall();
  Network.getArticles().then(response => render(response));
  document.querySelector('.side-action').addEventListener('click', () => {
    window.location.href = '/create';
  });
});
