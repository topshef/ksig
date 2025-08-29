const CACHE_NAME = 'ksig-cache-v1.715' // Increment version for updates
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
  // Only handle GET requests over HTTP(S)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Serve cached response immediately
        // Attempt to update in background
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone())
              return networkResponse
            })
          }
          return networkResponse
        }).catch(() => console.log('Network fetch failed'))

        return cachedResponse
      }

      // Not cached, fetch and cache if OK
      return fetch(event.request).then(networkResponse => {
        if (networkResponse.ok) {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone())
            return networkResponse
          })
        }
        return networkResponse
      })
    })
  )
})
