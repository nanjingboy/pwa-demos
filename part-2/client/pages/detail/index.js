import { initPullToRefresh, initSW, initAppInstall, renderEmpty } from '@/global';
import '@/global/index.css';
import './styles.css';

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
      window.location.href = `/edit/${window.currentRecordId}`;
    });
  } else {
    renderEmpty();
  }
}

window.addEventListener('load', () => {
  initSW();
  initAppInstall();
  window.currentRecordId = window.location.pathname.match(/(\d+)/)[0];
  setTimeout(() => {
    render({
      title: '文章标题',
      content: '文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容文章内容。',
      created_at: '2019-06-01 12:00:00',
      updated_at: '2019-06-01 12:00:00',
    });
    initPullToRefresh(() => {
      console.log('hello world');
    });
  }, 1000);
});
