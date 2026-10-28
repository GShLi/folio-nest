(function () {
  var saved;
  try {
    saved = localStorage.getItem('work-show-theme');
  } catch (_) {}
  var dark =
    saved === 'dark' ||
    saved === 'studio' ||
    (saved !== 'light' &&
      saved !== 'editorial' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.style = dark ? 'studio' : 'editorial';
  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute('content', dark ? '#151719' : '#f6f5f1');
})();
