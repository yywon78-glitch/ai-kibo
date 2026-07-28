/* 스마트 기보보기 — 셸 캐시 + 기보 런타임 캐시 */
const SHELL_CACHE = 'kibo-shell-v3';
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

  // 기보 데이터: 한 번 받으면 캐시 우선(오프라인 열람 가능)
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

  // 목록/문서: 네트워크 우선, 실패 시 캐시(셸) 폴백
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

  // 그 외(아이콘 등): 캐시 우선
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req))
  );
});
