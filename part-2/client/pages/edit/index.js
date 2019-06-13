import { initSW } from '@/global';
import '@/global/index.css';
import './styles.css';

window.addEventListener('load', () => {
  initSW();
  const { pathname } = window.location;
  if (/^\/edit\/\d+$/.test(pathname)) {
    window.currentRecordId = pathname.match(/(\d+)/)[0];
    document.querySelector('.container > .actions > .delete').style.display = 'block';
  }
});
