// 白地図ナビ：アプリ本体をスマホに保存して、圏外でも開けるようにする
const SHELL_CACHE = 'hakuchizu-shell-v2';
const SHELL = [
  './genzaichi_map.html',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hakuchizu-shell-') && k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // ページ本体：電波があれば最新版、なければ保存版
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('.html'))) {
    e.respondWith(
      fetch(req)
        .then((r) => { const copy = r.clone(); caches.open(SHELL_CACHE).then((c) => c.put('./genzaichi_map.html', copy)); return r; })
        .catch(() => caches.match('./genzaichi_map.html'))
    );
    return;
  }

  // 地図ライブラリ：保存版を優先
  if (url.hostname === 'unpkg.com') {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      const copy = r.clone(); caches.open(SHELL_CACHE).then((c) => c.put(req, copy)); return r;
    })));
  }
  // 地図タイルはページ側で保存・読み出しする
});
