const MARKER_THUMB_SIZE = 64
const POPUP_THUMB_SIZE = 560
const MAX_CONCURRENT_LOADS = 6
const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry {
  url: string
  timestamp: number
  blob?: Blob
  error?: boolean
}

const imageCache = new Map<string, CacheEntry>()
const loadingPromises = new Map<string, Promise<string | null>>()
let activeLoads = 0
const loadQueue: Array<() => void> = []

export function getThumbnailUrl(originalUrl: string, width: number): string {
  if (!originalUrl) return ''

  if (originalUrl.includes('commons.wikimedia.org/wiki/Special:FilePath/')) {
    const filename = originalUrl.split('/Special:FilePath/')[1]
    if (!filename) return originalUrl
    const encoded = encodeURIComponent(filename)
    return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encoded}?width=${width}`
  }

  if (originalUrl.includes('upload.wikimedia.org')) {
    const separator = originalUrl.includes('?') ? '&' : '?'
    return `${originalUrl}${separator}width=${width}`
  }

  return originalUrl
}

export function getMarkerImageUrl(originalUrl: string): string {
  if (!originalUrl) return ''
  return getThumbnailUrl(originalUrl, MARKER_THUMB_SIZE)
}

export function getPopupImageUrl(originalUrl: string): string {
  if (!originalUrl) return ''
  return getThumbnailUrl(originalUrl, POPUP_THUMB_SIZE)
}

function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL_MS
}

function enqueueLoad(): boolean {
  if (activeLoads < MAX_CONCURRENT_LOADS) {
    activeLoads++
    return true
  }
  return false
}

function dequeueLoad(): void {
  activeLoads--
  if (loadQueue.length > 0) {
    const next = loadQueue.shift()!
    next()
  }
}

async function loadImageWithQueue(url: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const tryLoad = async () => {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const blob = await response.blob()
        if (!blob.type.startsWith('image/')) throw new Error('Not an image')
        resolve(blob)
      } catch {
        resolve(null)
      } finally {
        dequeueLoad()
      }
    }

    if (!enqueueLoad()) {
      loadQueue.push(tryLoad)
    } else {
      tryLoad()
    }
  })
}

export async function preloadImage(url: string): Promise<string | null> {
  if (!url) return null

  const cached = imageCache.get(url)
  if (cached && isCacheValid(cached)) {
    return cached.error ? null : url
  }

  const existing = loadingPromises.get(url)
  if (existing) return existing

  const promise = (async () => {
    const blob = await loadImageWithQueue(url)
    if (blob) {
      const objectUrl = URL.createObjectURL(blob)
      imageCache.set(url, { url: objectUrl, timestamp: Date.now(), blob })
      return objectUrl
    }
    imageCache.set(url, { url, timestamp: Date.now(), error: true })
    return null
  })()

  loadingPromises.set(url, promise)
  promise.finally(() => loadingPromises.delete(url))

  return promise
}

export function preloadSpeciesImages(imageUrls: string[], markerOnly = false): void {
  const urls = [...new Set(imageUrls.filter(Boolean))]
  const markerUrls = urls.map(u => getMarkerImageUrl(u))
  
  markerUrls.forEach(url => {
    if (url) preloadImage(url)
  })

  if (!markerOnly) {
    const popupUrls = urls.map(u => getPopupImageUrl(u))
    popupUrls.forEach(url => {
      if (url) preloadImage(url)
    })
  }
}

export function setupLazyMarkerImage(
  element: HTMLElement,
  originalImageUrl: string,
  color: string,
  mapElement?: HTMLElement
): void {
  if (!originalImageUrl || !element) return

  const thumbUrl = getMarkerImageUrl(originalImageUrl)
  if (!thumbUrl) return

  const loadAndApply = async () => {
    const cached = imageCache.get(thumbUrl)
    let imageUrl: string | null = null

    if (cached && isCacheValid(cached)) {
      imageUrl = cached.error ? null : cached.url
    } else {
      imageUrl = await preloadImage(thumbUrl)
    }

    if (imageUrl && element.isConnected) {
      element.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.18)), url("${imageUrl}")`
      element.style.backgroundSize = 'cover'
      element.style.backgroundPosition = 'center'
    }
  }

  if (mapElement && typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadAndApply()
            observer.disconnect()
          }
        })
      },
      { root: mapElement, rootMargin: '200px' }
    )
    observer.observe(element)
    ;(element as any)._imageObserver = observer
  } else {
    loadAndApply()
  }
}

export function cleanupLazyMarkerImage(element: HTMLElement): void {
  const observer = (element as any)._imageObserver as IntersectionObserver | undefined
  if (observer) {
    observer.disconnect()
    delete (element as any)._imageObserver
  }
}

export function clearImageCache(): void {
  imageCache.forEach(entry => {
    if (entry.blob && entry.url.startsWith('blob:')) {
      URL.revokeObjectURL(entry.url)
    }
  })
  imageCache.clear()
  loadingPromises.clear()
  loadQueue.length = 0
  activeLoads = 0
}
