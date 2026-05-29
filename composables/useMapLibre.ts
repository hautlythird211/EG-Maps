import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useOfflineTiles } from './useOfflineTiles'

export function getMapStyle(apiKey?: string): string {
  if (apiKey) return `https://api.maptiler.com/maps/satellite/style.json?key=${apiKey}`
  return 'https://demotiles.maplibre.org/style.json'
}

const tileResponseCache = new Map<string, ArrayBuffer>()
const MAX_TILE_CACHE = 500

export function useMapLibre(
  containerRef: Ref<HTMLDivElement | null>,
  options: {
    isGlobe?: boolean
    isMobile?: boolean
    mapStyle?: string
    onLoad?: (_map: MapLibreMap) => void
  } = {}
) {
  const map = ref<MapLibreMap | null>(null)
  const isLoading = ref(true)
  const hasError = ref(false)
  let isMounted = true
  let errorCount = 0
  let usedFallback = false
  let loadTimeout: ReturnType<typeof setTimeout> | null = null
  let idleCacheTimer: ReturnType<typeof setTimeout> | null = null

  const apiKey = (typeof useRuntimeConfig !== 'undefined')
    ? useRuntimeConfig().public.maptilerApiKey
    : ''

  const offlineTiles = useOfflineTiles(apiKey, containerRef)
  let offlineInitialized = false

  onMounted(() => {
    isMounted = true
    if (!offlineInitialized) {
      offlineTiles.init().then(() => { offlineInitialized = true })
      offlineInitialized = true
    }
  })

  onUnmounted(() => {
    isMounted = false
    if (loadTimeout) clearTimeout(loadTimeout)
    if (idleCacheTimer) clearTimeout(idleCacheTimer)
    if (map.value) {
      map.value.remove()
      map.value = null
    }
  })

  async function loadNearbyTilesToMemoryCache(m: MapLibreMap) {
    const z = Math.floor(m.getZoom())
    const center = m.getCenter()
    const x = Math.floor((center.lng + 180) / 360 * Math.pow(2, z))
    const y = Math.floor((1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z))

    const minX = Math.max(0, x - 3)
    const maxX = Math.min(Math.pow(2, z) - 1, x + 3)
    const minY = Math.max(0, y - 3)
    const maxY = Math.min(Math.pow(2, z) - 1, y + 3)

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const buf = await offlineTiles.getTile(z, cx, cy)
        if (buf && !tileResponseCache.has(`tile:${z}/${cx}/${cy}`)) {
          tileResponseCache.set(`tile:${z}/${cx}/${cy}`, buf)
          if (tileResponseCache.size > MAX_TILE_CACHE) {
            const firstKey = tileResponseCache.keys().next().value
            if (firstKey) tileResponseCache.delete(firstKey)
          }
        }
      }
    }
  }

  function createTransformRequest() {
    return (url: string, resourceType?: string) => {
      if (resourceType === 'Tile') {
        const match = url.match(/\/satellite\/(\d+)\/(\d+)\/(\d+)\./)
        if (match) {
          const [, z, x, y] = match
          const cacheKey = `tile:${z}/${x}/${y}`
          const cached = tileResponseCache.get(cacheKey)
          if (cached) {
            const blob = new Blob([cached], { type: 'image/jpeg' })
            const blobUrl = URL.createObjectURL(blob)
            return { url: blobUrl }
          }
        }
      }
      return { url }
    }
  }

  function cleanupBlobUrls() {
    for (const key of tileResponseCache.keys()) {
      const val = tileResponseCache.get(key)
      if (val instanceof Blob) { } // skip
    }
  }

  async function initMap() {
    if (!containerRef.value) return

    isLoading.value = true
    hasError.value = false
    errorCount = 0
    usedFallback = false

    try {
      const maplibregl = await import('maplibre-gl')
      const style = options.mapStyle || getMapStyle()
      const tr = createTransformRequest()
      const m = new maplibregl.Map({
        container: containerRef.value,
        style,
        zoom: options.isMobile ? 1.8 : options.isGlobe ? 2.5 : 3,
        center: options.isGlobe ? [0, 20] : [0, 0],
        attributionControl: false,
        renderWorldCopies: !options.isGlobe,
        fadeDuration: 100,
        maxTileCacheSize: 200,
        maxTileCacheZoomLevels: 5,
        transformRequest: tr,
      } as maplibregl.MapOptions & { antialias?: boolean })

      m.addControl(new maplibregl.AttributionControl({
        customAttribution: `EARTH GUARDIANS @ ${new Date().getFullYear()}`
      }))

      if (!options.isMobile && !options.isGlobe) {
        m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-left')
      }

      if (options.isGlobe) {
        m.on('style.load', () => {
          try { m.setProjection({ type: 'globe' }) } catch (e) {
            console.error('Error setting globe projection:', e)
          }
        })
      }

      m.on('load', () => {
        if (!isMounted) return
        isLoading.value = false
        options.onLoad?.(m)
      })

      m.on('idle', () => {
        if (!isMounted) return
        if (idleCacheTimer) clearTimeout(idleCacheTimer)
        idleCacheTimer = setTimeout(async () => {
          if (!navigator.onLine || !m) return
          loadNearbyTilesToMemoryCache(m)
          await cacheVisibleTiles(m)
        }, 2000)
      })

      m.on('error', (err: unknown) => {
        console.error('MapLibre error:', err)
        errorCount++
        if (!usedFallback && errorCount >= 2 && style.includes('maptiler.com')) {
          usedFallback = true
          console.warn('MapTiler style failed, falling back to demotiles style')
          m.setStyle('https://demotiles.maplibre.org/style.json')
          return
        }
        if (!m.loaded()) {
          isLoading.value = false
          hasError.value = true
        }
      })

      loadTimeout = setTimeout(() => { if (isLoading.value) isLoading.value = false }, 10000)
      map.value = m
    } catch (err) {
      console.error('Failed to initialize map:', err)
      isLoading.value = false
      hasError.value = true
    }
  }

  async function cacheVisibleTiles(m: MapLibreMap) {
    if (!navigator.onLine) return
    const canvas = m.getCanvas()
    if (!canvas) return
    const sources = m.getStyle().sources
    for (const id of Object.keys(sources)) {
      const source = sources[id]
      if (source.type === 'raster') {
        const tiles = (source as { tiles?: string[] }).tiles
        if (tiles && tiles.length > 0 && tiles[0].includes('maptiler.com/tiles/satellite/')) {
          const z = Math.floor(m.getZoom())
          const center = m.getCenter()
          const x = Math.floor((center.lng + 180) / 360 * Math.pow(2, z))
          const y = Math.floor((1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z))
          const minX = Math.max(0, x - 4)
          const maxX = Math.min(Math.pow(2, z) - 1, x + 4)
          const minY = Math.max(0, y - 4)
          const maxY = Math.min(Math.pow(2, z) - 1, y + 4)

          for (let cx = minX; cx <= maxX; cx++) {
            for (let cy = minY; cy <= maxY; cy++) {
              const cacheKey = `tile:${z}/${cx}/${cy}`
              if (!tileResponseCache.has(cacheKey)) {
                offlineTiles.hasTile(z, cx, cy).then(found => {
                  if (!found) {
                    const url = `https://api.maptiler.com/tiles/satellite/${z}/${cx}/${cy}.jpg?key=${apiKey}`
                    fetch(url).then(resp => {
                      if (resp.ok) {
                        resp.arrayBuffer().then(buf => {
                          offlineTiles.setTile(z, cx, cy, buf, 'image/jpeg')
                          if (tileResponseCache.size < MAX_TILE_CACHE) {
                            tileResponseCache.set(cacheKey, buf)
                          }
                        })
                      }
                    }).catch(() => {})
                  } else {
                    offlineTiles.getTile(z, cx, cy).then(buf => {
                      if (buf && tileResponseCache.size < MAX_TILE_CACHE) {
                        tileResponseCache.set(cacheKey, buf)
                      }
                    })
                  }
                })
              }
            }
          }
          break
        }
      }
    }
  }

  function retry() {
    hasError.value = false
    initMap()
  }

  return {
    map,
    isLoading,
    hasError,
    initMap,
    retry,
    offlineTiles,
  }
}
