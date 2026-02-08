const CACHE_NAME = 'tareq-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية Network First لـ Google Docs
self.addEventListener('fetch', event => {
  // تجاهل طلبات Google Docs - دعها تعمل مباشرة
  if (event.request.url.includes('docs.google.com')) {
    return;
  }

  // للملفات المحلية: Cache First
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // تخزين فقط الاستجابات الناجحة
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));
          }
          return response;
        });
      })
      .catch(() => {
        // في حالة عدم الاتصال - إرجاع الصفحة الرئيسية
        return caches.match('./index.html');
      })
  );
});
