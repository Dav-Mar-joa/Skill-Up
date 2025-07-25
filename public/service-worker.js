self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open('v1').then(function(cache) {
        return cache.addAll([
          '/',
          '/index.html',
          '/assets/css/styles.css',
          '/assets/icons/icon192.png',
          '/assets/icons/icon512.png'
        ]);
      })
    );
  });
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') {
    // Laisse passer tout ce qui n'est pas GET (POST, PUT, DELETE...)
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

  