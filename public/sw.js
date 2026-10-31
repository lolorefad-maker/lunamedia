// كاش بسيط للواجهة عشان تفتح بسرعة وبدون نت. طلبات /api ما بتتخزن أبداً.
const CACHE = 'zl-shell-v2';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'merge.js', 'config.js', 'manifest.webmanifest', 'icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.includes('/api/')) return;
  const sameOrigin = url.origin === self.location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.host);
  if (!sameOrigin && !isFont) return;
  if (sameOrigin) {
    // network-first: دايماً آخر نسخة، والكاش بس لما ما في نت
    e.respondWith(fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  // الخطوط: من الكاش أول
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(e.request);
    if (hit) return hit;
    const res = await fetch(e.request);
    if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone());
    return res;
  }));
});
