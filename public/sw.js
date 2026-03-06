// PACT Marketplace Service Worker
// Multi-strategy caching with offline support

const CACHE_VERSION = 'pact-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const IMAGE_CACHE = `${CACHE_VERSION}-images`
const API_CACHE = `${CACHE_VERSION}-api`

// Assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
]

// Routes that should use network-first strategy
const NETWORK_FIRST_ROUTES = [
  '/api/',
  '/auth/',
]

// Routes that should always go to network (never cache)
const NETWORK_ONLY_ROUTES = [
  '/api/payments/',
  '/api/webhooks/',
  '/api/cron/',
]

// Install: precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Silent fail - some assets may not be available during build
      })
    })
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('pact-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Fetch: apply caching strategies based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return

  // Network-only for payment and webhook routes (never cache sensitive data)
  if (NETWORK_ONLY_ROUTES.some((route) => url.pathname.startsWith(route))) {
    return
  }

  // Network-first for API routes
  if (NETWORK_FIRST_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  // Cache-first for images
  if (request.destination === 'image' || url.pathname.startsWith('/images/')) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }

  // Cache-first for static assets (JS, CSS, fonts)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Stale-while-revalidate for pages
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
})

// Cache-first strategy: check cache, fallback to network
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return caches.match('/offline.html')
  }
}

// Network-first strategy: try network, fallback to cache
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Stale-while-revalidate: return cache immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    // Update cache in background
    networkFetch.catch(() => {})
    return cached
  }

  // No cache, must wait for network
  try {
    const response = await networkFetch
    if (response) return response
  } catch {
    // Fall through to offline
  }

  return caches.match('/offline.html') || new Response('Offline', { status: 503 })
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const payload = event.data.json()
    const options = {
      body: payload.body || 'New update from PACT',
      icon: payload.icon || '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: payload.tag || 'pact-notification',
      data: payload.data || {},
      actions: payload.actions || [],
      vibrate: [100, 50, 100],
      requireInteraction: false,
    }

    event.waitUntil(
      self.registration.showNotification(payload.title || 'PACT Marketplace', options)
    )
  } catch {
    // Silent fail for malformed push data
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const targetUrl = data.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // Open new window
      return self.clients.openWindow(targetUrl)
    })
  )
})

// Background sync for queued pledges
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pledges') {
    event.waitUntil(syncPendingPledges())
  }
})

async function syncPendingPledges() {
  try {
    const cache = await caches.open('pact-pending-actions')
    const requests = await cache.keys()

    for (const request of requests) {
      try {
        const cached = await cache.match(request)
        if (cached) {
          const body = await cached.json()
          await fetch(request, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          await cache.delete(request)
        }
      } catch {
        // Will retry on next sync
      }
    }
  } catch {
    // Silent fail
  }
}
