// Compatibility for browsers with a cached copy of the retired homepage.
(() => {
  const target = new URL('/index.html', window.location.origin);
  target.searchParams.set('v', '20261115-static');
  target.hash = window.location.hash;
  window.location.replace(target.href);
})();
