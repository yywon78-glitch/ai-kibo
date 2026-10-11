/* 스마트 기보 앱 서비스워커 — 온라인 전용(광고 모델)
   · 앱 파일(자기 출처)은 항상 네트워크에서 최신으로 받음(HTTP 캐시 우회) → 업데이트 즉시 반영
   · 캐시/오프라인 없음 → 인터넷 없으면 열리지 않음(온라인 전제)
   · 광고 등 외부(교차 출처) 요청은 간섭하지 않고 그대로 통과 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))   // 과거 캐시 전부 정리
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;              // 광고/외부 요청 → 그대로 통과
  e.respondWith(fetch(e.request, { cache: 'no-store' }));   // 앱 파일 → 항상 네트워크 최신, 캐시 안 함
});
