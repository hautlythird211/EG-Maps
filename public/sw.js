const CACHE_VERSION = 'v2'
const STATIC_CACHE = `eg-maps-static-${CACHE_VERSION}`
const DATA_CACHE = `eg-maps-data-${CACHE_VERSION}`
const IMAGE_CACHE = `eg-maps-images-${CACHE_VERSION}`

const PRECACHE_URLS = [
  '/',
  '/project-grants',
  '/project-grants/3d',
  '/endangered-species',
  '/endangered-species/3d',
  '/globe',
  '/info',
  '/manifest.json',
  '/eg-logo.png',
]

const TILE_DB_NAME = 'eg-maps-tile-cache'
const TILE_STORE_NAME = 'tiles'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DATA_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

function openTileDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(TILE_DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(TILE_STORE_NAME)) {
        db.createObjectStore(TILE_STORE_NAME, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function getTileFromDB(z, x, y) {
  const key = `${z}/${x}/${y}`
  return openTileDB().then((db) => {
    return new Promise((resolve) => {
      const tx = db.transaction(TILE_STORE_NAME, 'readonly')
      const store = tx.objectStore(TILE_STORE_NAME)
      const req = store.get(key)
      req.onsuccess = () => {
        if (req.result) {
          resolve(new Response(req.result.data, {
            headers: { 'Content-Type': req.result.contentType || 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' }
          }))
        } else {
          resolve(null)
        }
      }
      req.onerror = () => resolve(null)
    })
  }).catch(() => null)
}

function isTileRequest(url) {
  return url.href.includes('maptiler.com/tiles/satellite/')
}

function extractTileCoords(url) {
  const match = url.pathname.match(/\/satellite\/(\d+)\/(\d+)\/(\d+)\./)
  if (match) return { z: parseInt(match[1]), x: parseInt(match[2]), y: parseInt(match[3]) }
  const match2 = url.href.match(/\/satellite\/(\d+)\/(\d+)\/(\d+)\./)
  if (match2) return { z: parseInt(match2[1]), x: parseInt(match2[2]), y: parseInt(match2[3]) }
  return null
}

function isLocalTileRequest(url) {
  return url.pathname.match(/^\/tiles\/(\d+)\/(\d+)\/(\d+)\./)
}

function extractLocalTileCoords(url) {
  const match = url.pathname.match(/^\/tiles\/(\d+)\/(\d+)\/(\d+)\./)
  if (match) return { z: parseInt(match[1]), x: parseInt(match[2]), y: parseInt(match[3]) }
  return null
}

function isImageRequest(url) {
  return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i) || url.href.includes('/images/')
}

function isDataRequest(url) {
  return url.pathname.match(/\/locales\//) || url.pathname.match(/\/data\//)
}

function isAppShell(url) {
  return url.pathname.match(/\.(js|css|json)$/) || PRECACHE_URLS.includes(url.pathname)
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (isLocalTileRequest(url)) {
    const coords = extractLocalTileCoords(url)
    if (coords) {
      event.respondWith(
        getTileFromDB(coords.z, coords.x, coords.y).then((cached) => {
          if (cached) return cached
          return new Response('', { status: 404 })
        })
      )
      return
    }
  }

  if (isTileRequest(url)) {
    event.respondWith(
      (async () => {
        const coords = extractTileCoords(url)
        if (coords) {
          const cached = await getTileFromDB(coords.z, coords.x, coords.y)
          if (cached) return cached
        }
        try {
          const response = await fetch(event.request)
          if (response.ok && coords) {
            const clone = response.clone()
            clone.arrayBuffer().then((buf) => {
              openTileDB().then((db) => {
                const tx = db.transaction(TILE_STORE_NAME, 'readwrite')
                tx.objectStore(TILE_STORE_NAME).put({
                  key: `${coords.z}/${coords.x}/${coords.y}`,
                  data: buf,
                  contentType: 'image/jpeg',
                  timestamp: Date.now(),
                  size: buf.byteLength
                })
              }).catch(() => {})
            }).catch(() => {})
          }
          return response
        } catch {
          return new Response('', { status: 503 })
        }
      })()
    )
    return
  }

  if (isImageRequest(url)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE))
    return
  }

  if (isDataRequest(url)) {
    event.respondWith(networkFirst(event.request, DATA_CACHE))
    return
  }

  if (isAppShell(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE))
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, STATIC_CACHE, '/'))
    return
  }

  event.respondWith(networkFirst(event.request, STATIC_CACHE))
})

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
    return caches.match('/')
  }
}

async function networkFirst(request, cacheName, fallbackUrl) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (fallbackUrl) return caches.match(fallbackUrl)
    return new Response('Offline', { status: 503 })
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
