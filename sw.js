/* Service Worker — يخلي التطبيق يشتغل بدون إنترنت وقابل للتثبيت */
const CACHE = 'bintelsbeit-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // لا نعترض طلبات النطق من Google (تشغيل صوتي مباشر)
  try{ if (new URL(req.url).hostname.indexOf('translate.google') !== -1) return; }catch(_){}

  // صفحات التنقّل: نجيب أحدث نسخة أونلاين، ونرجع للكاش لو ما فيه نت
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => { caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; })
        .catch(() => caches.match(req).then((m) => m || caches.match('./index.html')))
    );
    return;
  }

  // باقي الملفات: من الكاش أولاً، وإلا من الشبكة (ونخزّنها)
  e.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((res) => {
        caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })
    )
  );
});
