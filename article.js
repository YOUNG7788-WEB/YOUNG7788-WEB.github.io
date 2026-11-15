// Compatibility for browsers with a cached copy of the retired article shell.
(() => {
  const ids = new Set([
    'a-share-quant-research', 'garden-origin', 'x-notes', 'my-path',
    'night-talk', 'engineering-study', 'study-rhythm', 'vps-review',
    'touchpad-review', 'system-maintenance', 'ai-workflow', 'website-build',
    'briefing-process', 'parallel-universe', 'night-video', 'creative-reading',
    'network-life', 'f1-business', 'contact-me'
  ]);
  const id = new URLSearchParams(window.location.search).get('id');
  const path = ids.has(id) ? '/posts/' + id + '.html' : '/index.html#collection';
  window.location.replace(new URL(path, window.location.origin).href);
})();
