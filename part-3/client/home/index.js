import { initSW, initAppInstall } from '@/global';
import '@/global/index.css';
import './styles.css';

window.onListItemClicked = function(id) {
  window.location.href = `/detail/${id}`;
}

window.addEventListener('load', () => {
  initSW();
  initAppInstall();
  document.querySelector('.side-action').addEventListener('click', () => {
    window.location.href = '/create';
  });
});
