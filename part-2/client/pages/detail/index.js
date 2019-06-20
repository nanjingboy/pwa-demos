import { initSW, initAppInstall, renderEmpty } from '@/global';
import '@/global/index.css';
import './styles.css';

let currentRecordId = null;

function render(data) {
  if (data) {
    const html = `<div class="detail">
      <div class="title">${data.title}</div>
      <div class="times">
        <div>首发于：${data.created_at}</div>
        <div>更新于：${data.updated_at}</div>
      </div>
      <div class="content">${data.content}</div>`;
    document.querySelector('.container').innerHTML = html;
    const sideActionEl = document.querySelector('.side-action');
    sideActionEl.style.display = 'block';
    sideActionEl.addEventListener('click', () => {
      window.location.href = `/edit/${currentRecordId}`;
    });
  } else {
    renderEmpty();
  }
}

window.addEventListener('load', () => {
  initSW();
  initAppInstall();
  currentRecordId = window.location.pathname.match(/(\d+)/)[0];
  Network.getArticle(currentRecordId).then(response => render(response));
});
