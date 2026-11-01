// Offline support for Plate Log.
// Pages: try the network briefly so new versions show up, fall back to the saved copy when there's no signal.
// Everything else (icons, fonts): saved copy first, refreshed in the background.
const CACHE = 'platelog-v5';
const SHELL = ['./', 'index.html', 'quest.js?v=4', 'quest-sprite.js?v=2', 'quest.css?v=4', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

function save(req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    const network = fetch(req).then(res => save(req, res));
    const slow = new Promise(resolve => setTimeout(resolve, 3000));   // weak gym signal: don't wait forever
    e.respondWith(
      Promise.race([network, slow.then(() => caches.match(req, { ignoreSearch: true }).then(r => r || network))])
        .catch(() => caches.match('index.html'))
        .then(r => r || caches.match('index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      const fresh = fetch(req).then(res => save(req, res)).catch(() => cached);
      return cached || fresh;
    })
  );
});
