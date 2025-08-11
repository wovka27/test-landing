export default function debounce(fn, delay) {
  let timerId;

  return function(...args) {
    clearTimeout(timerId);

    timerId = setTimeout(fn.bind(this, args), delay);
  };
}