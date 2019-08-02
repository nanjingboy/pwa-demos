import toastr from 'toastr';
import 'toastr/build/toastr.min.css';

const defaultToastOptions = {
  ...toastr.options,
  positionClass: 'toast-top-center',
  timeOut: 1000,
  extendedTimeOut: 0
};

export function toast(type, message, options = {}) {
  toastr.remove();
  Object.assign(toastr.options, defaultToastOptions, options);
  toastr[type](message);
}