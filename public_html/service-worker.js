const CACHE_NAME = 'ksig-cache-v1.48' // Increment version for updates
const urlsToCache = [
  '/',
  '/index.php', // Adjust for your actual page path
  'assets/css/style.css',
  'assets/img/ksig.ico',
  'assets/img/ksig.uk.png',
  'assets/img/iconScanQR.png',
  'assets/img/iconScanSeedNFC.svg',
  'assets/img/iconEnterSeedManual.png',
  'assets/img/key.jpg',
  'assets/js/jquery-3.6.0.min.js',
  'assets/js/instascan.min.js',
  'assets/js/qrcode.min.js',
  'assets/js/nacl-fast.min.js',
  'assets/js/utils.js',
  'assets/js/ksig.js',
  'remoteLogger.js'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching assets:', urlsToCache)
      return cache.addAll(urlsToCache)
    }).then(() => {
      self.skipWaiting() // Activate immediately
    })
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    ).then(() => self.clients.claim()) // Claim clients immediately
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Optionally update in background
        fetch(event.request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone())
          })
        }).catch(() => console.log('Network fetch failed, serving cached response'))
        return cachedResponse
      }
      return fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone())
        })
        return networkResponse
      })
    })
  )
})
