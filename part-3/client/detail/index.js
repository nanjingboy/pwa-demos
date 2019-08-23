import { initSW, initAppInstall } from '@/global';
import '@/global/index.css';
import './styles.css';

window.addEventListener('load', () => {
  const currentRecordId = window.location.pathname.match(/(\d+)/)[0];
  document.querySelector('.side-action').addEventListener('click', () => {
    window.location.href = `/edit/${currentRecordId}`;
  });
  initSW();
  initAppInstall();
});
