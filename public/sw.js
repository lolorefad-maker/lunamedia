// كاش بسيط للواجهة عشان تفتح بسرعة وبدون نت. طلبات /api ما بتتخزن أبداً.
const CACHE = 'zl-shell-v1';
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
  // stale-while-revalidate: افتح من الكاش وحدّث بالخلفية
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(e.request, { ignoreSearch: sameOrigin });
    const net = fetch(e.request).then((res) => { if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
