/* ============================================================================
   TRABAJADOR DE SERVICIO
   ============================================================================
   Hace dos cosas, las dos imprescindibles:

   1. La tarjeta abre SIN SEÑAL. Dentro de un restaurante el wifi es malo y los
      datos peores; una tarjeta que gira una rueda de carga mientras el mesero
      espera no sirve de nada.
   2. En Android, el navegador solo ofrece instalar una página si tiene esto.

   Estrategia: la caja fuerte primero. Se guarda todo al instalar y se sirve
   desde ahí, mientras por detrás se busca una versión nueva para la próxima vez.
   Al cambiar VERSION se borra lo viejo y se vuelve a guardar.
   ========================================================================== */

var VERSION = 'huemul-v1';

var GUARDAR = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icono-192.png',
  './icono-512.png',
  './icono-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION)
      .then(function (c) { return c.addAll(GUARDAR); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) {
        return Promise.all(ks.map(function (k) {
          return k === VERSION ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== location.origin) return;   // las fuentes de Google se las arregla el navegador

  // Una navegación siempre devuelve la tarjeta, esté como esté la red.
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(function (hit) {
        return hit || fetch(req);
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) {
        // Se sirve lo guardado y se busca lo nuevo por detrás, sin hacer esperar.
        fetch(req).then(function (res) {
          if (res && res.ok) caches.open(VERSION).then(function (c) { c.put(req, res); });
        }).catch(function () {});
        return hit;
      }
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copia = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copia); });
        }
        return res;
      });
    })
  );
});
