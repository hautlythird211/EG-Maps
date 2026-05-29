<script setup lang="ts">
/**
 * UnifiedMapOptimized - High-performance 2D map with GPU markers and chunked loading
 * Handles 10,000+ entities with 60fps animations and SSG compatibility
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useChunkedDataLoader } from '~/composables/useChunkedDataLoader'
import { useHighPerformanceMarkers } from '~/composables/useHighPerformanceMarkers'
import { useExternalAPI } from '~/composables/useExternalAPI'
import { useOfflineTiles } from '~/composables/useOfflineTiles'
import AnimatedGlobeLoader from '~/components/AnimatedGlobeLoader.vue'
import LoadingMarkerBubble from '~/components/LoadingMarkerBubble.vue'

interface MapEntity {
  id: string | number
  type: 'project' | 'species'
  name: string
  coordinates: [number, number]
  properties: Record<string, unknown>
}

interface Props {
  center?: [number, number]
  zoom?: number
  style?: string
  dataSource?: 'projects' | 'species' | 'external'
  externalEndpoint?: string
  maxEntities?: number
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [0, 20],
  zoom: 2,
  style: 'satellite',
  dataSource: 'species',
  maxEntities: 10000
})

const emit = defineEmits<{
  'entity-click': [entity: MapEntity]
  'entity-hover': [entity: MapEntity | null]
  'load-complete': [count: number]
  'load-error': [error: Error]
}>()

// Map instance
const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<MapLibreMap | null>(null)
const mapLoaded = ref(false)

// Loading state
const isLoading = ref(true)
const loadingProgress = ref(0)
const loadingPhase = ref<'initializing' | 'fetching' | 'processing' | 'rendering' | 'complete'>('initializing')
const loadingEntities = ref<MapEntity[]>([])
const totalEntities = ref(0)

// Performance metrics
const fps = ref(60)
let lastFrameTime = performance.now()
let frameCount = 0

// Offline tiles
const apiKey = (typeof useRuntimeConfig !== 'undefined')
  ? useRuntimeConfig().public.maptilerApiKey
  : ''
const offlineTiles = useOfflineTiles(apiKey, mapContainer)
const tileMemoryCache = new Map<string, ArrayBuffer>()
const MAX_MEMORY_TILES = 300

function getCachedTileUrl(url: string, resourceType?: string): string | null {
  if (resourceType !== 'Tile') return null
  const match = url.match(/\/satellite\/(\d+)\/(\d+)\/(\d+)\./)
  if (!match) return null
  const cacheKey = `tile:${match[1]}/${match[2]}/${match[3]}`
  const buf = tileMemoryCache.get(cacheKey)
  if (buf) {
    return URL.createObjectURL(new Blob([buf], { type: 'image/jpeg' }))
  }
  return null
}

async function preloadTileCacheFromIndexedDB() {
  const m = map.value
  if (!m) return
  const z = Math.floor(m.getZoom())
  const center = m.getCenter()
  const x = Math.floor((center.lng + 180) / 360 * Math.pow(2, z))
  const y = Math.floor((1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z))

  for (let cx = Math.max(0, x - 4); cx <= Math.min(Math.pow(2, z) - 1, x + 4); cx++) {
    for (let cy = Math.max(0, y - 4); cy <= Math.min(Math.pow(2, z) - 1, y + 4); cy++) {
      if (tileMemoryCache.size >= MAX_MEMORY_TILES) return
      const key = `tile:${z}/${cx}/${cy}`
      if (!tileMemoryCache.has(key)) {
        const buf = await offlineTiles.getTile(z, cx, cy)
        if (buf) tileMemoryCache.set(key, buf)
      }
    }
  }
}

// Marker management
const markerManager = ref<ReturnType<typeof useHighPerformanceMarkers> | null>(null)

// Chunked data loader
const { state: loaderState, entities, isLoading: isChunkLoading, load: loadData } = useChunkedDataLoader<MapEntity>({
  chunkSize: 100,
  processingDelay: 16,
  onProgress: (progress, loaded, total) => {
    loadingProgress.value = progress
    if (progress < 33) {
      loadingPhase.value = 'fetching'
    } else if (progress < 66) {
      loadingPhase.value = 'processing'
    } else {
      loadingPhase.value = 'rendering'
    }
  },
  onChunkLoaded: (chunkIndex, chunk) => {
    // Incremental rendering
    loadingEntities.value = [...loadingEntities.value, ...chunk as MapEntity[]]
    updateMarkers(chunk as MapEntity[])
  }
})

// External API loader
const apiLoader = useExternalAPI()

/**
 * Initialize map
 */
const initializeMap = async () => {
  if (!mapContainer.value) return

  loadingPhase.value = 'initializing'

  // Create map instance
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: getMapStyle(),
    center: props.center,
    zoom: props.zoom,
    transformRequest: (url, resourceType) => {
      if (url.includes('api.maptiler.com') && resourceType === 'Tile') {
        const cachedUrl = getCachedTileUrl(url, resourceType)
        if (cachedUrl) return { url: cachedUrl }
        return {
          url,
          headers: { 'Authorization': `Bearer ${apiKey}` }
        }
      }
      return { url }
    }
  })

  offlineTiles.init()

  // Wait for map to load
  await new Promise<void>((resolve) => {
    map.value!.on('load', () => {
      mapLoaded.value = true
      resolve()
    })
  })

  // Initialize marker manager
  if (map.value) {
    markerManager.value = useHighPerformanceMarkers({
      map: map.value,
      sourceId: 'entities-source',
      layerId: 'entities-layer',
      clusterRadius: 50,
      clusterMaxZoom: 14,
      autoSwitchThreshold: 500
    })
  }

  // Start performance monitoring
  startPerformanceMonitoring()

  // Auto-cache tiles on idle
  map.value.on('idle', () => {
    if (!navigator.onLine || !map.value) return
    const m = map.value
    const sources = m.getStyle().sources
    for (const id of Object.keys(sources)) {
      const source = sources[id]
      if (source.type === 'raster') {
        const tiles = (source as { tiles?: string[] }).tiles
        if (tiles && tiles.length > 0 && tiles[0].includes('maptiler.com/tiles/')) {
          const z = Math.floor(m.getZoom())
          const center = m.getCenter()
          const x = Math.floor((center.lng + 180) / 360 * Math.pow(2, z))
          const y = Math.floor((1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z))
          for (let cx = Math.max(0, x - 4); cx <= Math.min(Math.pow(2, z) - 1, x + 4); cx++) {
            for (let cy = Math.max(0, y - 4); cy <= Math.min(Math.pow(2, z) - 1, y + 4); cy++) {
              offlineTiles.hasTile(z, cx, cy).then(found => {
                if (!found) {
                  const url = `https://api.maptiler.com/tiles/satellite/${z}/${cx}/${cy}.jpg?key=${apiKey}`
                  fetch(url).then(resp => {
                    if (resp.ok) resp.arrayBuffer().then(buf => offlineTiles.setTile(z, cx, cy, buf, 'image/jpeg'))
                  }).catch(() => {})
                }
              })
            }
          }
          preloadTileCacheFromIndexedDB()
          break
        }
      }
    }
  })

  // Load data
  await loadEntities()
}

/**
 * Get map style URL
 */
const getMapStyle = (): string => {
  const base = apiKey
    ? `https://api.maptiler.com/maps/hybrid/style.json?key=${apiKey}`
    : 'https://demotiles.maplibre.org/style.json'
  return base
}

/**
 * Load entities based on data source
 */
const loadEntities = async () => {
  try {
    loadingPhase.value = 'fetching'
    
    let dataProvider: () => Promise<MapEntity[]>

    if (props.dataSource === 'external' && props.externalEndpoint) {
      // External API loading
      const data = await apiLoader.loadEndpoint('entities', {
        url: props.externalEndpoint
      } as any)
      dataProvider = () => Promise.resolve(data as MapEntity[])
    } else if (props.dataSource === 'species') {
      // Species data from static JSON
      dataProvider = async () => {
        const response = await fetch('/data/species/index.json')
        const rawData = await response.json()
        return transformSpeciesData(rawData)
      }
    } else {
      // Project data (static)
      dataProvider = async () => {
        const { projectData } = await import('~/lib/project-data')
        return transformProjectData(projectData)
      }
    }

    loadingPhase.value = 'processing'
    await loadData(dataProvider)

    loadingPhase.value = 'complete'
    isLoading.value = false
    emit('load-complete', entities.value.length)

  } catch (error) {
    emit('load-error', error as Error)
    console.error('Failed to load entities:', error)
  }
}

/**
 * Transform species data to MapEntity format
 */
const transformSpeciesData = (rawData: any[]): MapEntity[] => {
  return rawData.slice(0, props.maxEntities).map((species: any) => ({
    id: species.id || species.name,
    type: 'species',
    name: species.name,
    coordinates: [species.longitude || species.lng || 0, species.latitude || species.lat || 0],
    properties: {
      category: species.category || 'Unknown',
      conservationStatus: species.conservationStatus || 'VU',
      scientificName: species.scientificName || species.name,
      population: species.population || 0,
      imageUrl: species.imageUrl || '',
      redBookUrl: species.redBookUrl || ''
    }
  }))
}

/**
 * Transform project data to MapEntity format
 */
const transformProjectData = (rawData: any[]): MapEntity[] => {
  return rawData.slice(0, props.maxEntities).map((project: any) => ({
    id: project.id || project.name,
    type: 'project',
    name: project.name,
    coordinates: [project.longitude || project.lng || 0, project.latitude || project.lat || 0],
    properties: {
      region: project.region || 'Unknown',
      country: project.country || 'Unknown',
      beneficiaries: project.beneficiaries || 0,
      funding: project.funding || 0,
      status: project.status || 'active',
      category: project.category || 'Unknown'
    }
  }))
}

/**
 * Update markers with GPU acceleration
 */
const updateMarkers = (newEntities: MapEntity[]) => {
  if (!markerManager.value) return

  if (!map.value?.getSource('entities-source')) {
    // Initialize first batch
    markerManager.value.initializeGPUMarkers(newEntities)
  } else {
    // Update existing
    markerManager.value.updateMarkers(newEntities)
  }
}

/**
 * Set up map event handlers
 */
const setupEventHandlers = () => {
  if (!map.value) return

  // Marker click handler
  map.value.on('markerclick' as any, (e: any) => {
    const entity = entities.value.find(ent => ent.id === e.id)
    if (entity) {
      emit('entity-click', entity)
    }
  })

  // Hover handler
  map.value.on('mouseenter', 'entities-layer', () => {
    if (map.value) map.value.getCanvas().style.cursor = 'pointer'
  })

  map.value.on('mouseleave', 'entities-layer', () => {
    if (map.value) map.value.getCanvas().style.cursor = ''
  })
}

/**
 * Performance monitoring
 */
const startPerformanceMonitoring = () => {
  const measureFPS = () => {
    const now = performance.now()
    frameCount++

    if (now - lastFrameTime >= 1000) {
      fps.value = Math.round(frameCount * 1000 / (now - lastFrameTime))
      frameCount = 0
      lastFrameTime = now
    }

    requestAnimationFrame(measureFPS)
  }

  requestAnimationFrame(measureFPS)
}

// Watch for map loaded
watch(mapLoaded, (loaded) => {
  if (loaded) {
    setupEventHandlers()
  }
})

// Lifecycle
onMounted(() => {
  nextTick(() => {
    initializeMap()
  })
})

onUnmounted(() => {
  if (markerManager.value) {
    markerManager.value.cleanup()
  }
  if (map.value) {
    map.value.remove()
  }
})

// Computed
const loadingMessage = computed(() => {
  const messages: Record<string, string> = {
    initializing: 'Initializing map...',
    fetching: 'Fetching data...',
    processing: 'Processing entities...',
    rendering: 'Rendering markers...',
    complete: 'Complete!'
  }
  return messages[loadingPhase.value]
})

const entityCount = computed(() => loadingEntities.value.length)
</script>

<template>
  <div class="unified-map-optimized">
    <!-- Loading overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <AnimatedGlobeLoader
          :progress="loadingProgress"
          :size="120"
          :show-progress="true"
          color-scheme="earth"
        />
        <div class="loading-text">
          <p class="loading-phase">{{ loadingMessage }}</p>
          <p class="loading-count">
            {{ entityCount.toLocaleString() }} / {{ totalEntities.toLocaleString() }} entities
          </p>
        </div>
        <div class="loading-progress-bar">
          <div
            class="loading-progress-fill"
            :style="{ width: `${loadingProgress}%` }"
          />
        </div>
      </div>

      <!-- Demo loading markers -->
      <div class="loading-markers-demo">
        <LoadingMarkerBubble type="loading" size="md" :animated="true" />
        <LoadingMarkerBubble type="project" size="md" :animated="true" />
        <LoadingMarkerBubble type="species" size="md" :animated="true" />
      </div>
    </div>

    <!-- Map container -->
    <div ref="mapContainer" class="map-container" />

    <!-- Performance stats (dev only) -->
    <div v-if="!isLoading" class="perf-stats">
      <span>{{ fps }} FPS</span>
      <span>{{ entityCount.toLocaleString() }} entities</span>
    </div>
  </div>
</template>

<style scoped>
.unified-map-optimized {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* Loading overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.loading-text {
  text-align: center;
  color: white;
}

.loading-phase {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.loading-count {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
}

.loading-progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.loading-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  transition: width 0.3s ease-out;
}

.loading-markers-demo {
  position: absolute;
  bottom: 24px;
  display: flex;
  gap: 16px;
}

/* Performance stats */
.perf-stats {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  gap: 12px;
  z-index: 10;
}
</style>
