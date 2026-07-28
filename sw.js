/* ?ㅻ쭏??湲곕낫蹂닿린 ????罹먯떆 + 湲곕낫 ?고???罹먯떆 */
const SHELL_CACHE = 'kibo-shell-v4';
const DATA_CACHE  = 'kibo-data-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'index.json',
               'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys
        .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
        .map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const url = new URL(req.url);

  // 湲곕낫 ?곗씠?? ??踰?諛쏆쑝硫?罹먯떆 ?곗꽑(?ㅽ봽?쇱씤 ?대엺 媛??
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    e.respondWith(
      caches.open(DATA_CACHE).then((c) =>
        c.match(req).then((hit) => hit || fetch(req).then((res) => {
          if (res && res.status === 200) c.put(req, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  // 紐⑸줉/臾몄꽌: ?ㅽ듃?뚰겕 ?곗꽑, ?ㅽ뙣 ??罹먯떆(?? ?대갚
  const isHTML = req.mode === 'navigate' || req.destination === 'document'
    || url.pathname.endsWith('/') || url.pathname.endsWith('.html')
    || url.pathname.endsWith('index.json');
  if (isHTML) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // 洹????꾩씠肄???: 罹먯떆 ?곗꽑
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req))
  );
});

