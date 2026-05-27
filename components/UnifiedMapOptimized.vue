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
    transformRequest: (url) => {
      // Add MapTiler authentication
      if (url.includes('api.maptiler.com')) {
        return {
          url: url,
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_MAPTILER_KEY || ''}`
          }
        }
      }
      return { url }
    }
  })

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

  // Load data
  await loadEntities()
}

/**
 * Get map style URL
 */
const getMapStyle = (): string => {
  const styles: Record<string, string> = {
    satellite: 'https://api.maptiler.com/maps/hybrid/style.json?key=' + (import.meta.env.VITE_MAPTILER_KEY || ''),
    streets: 'https://api.maptiler.com/maps/streets/style.json?key=' + (import.meta.env.VITE_MAPTILER_KEY || ''),
    dark: 'https://api.maptiler.com/maps/darkmatter/style.json?key=' + (import.meta.env.VITE_MAPTILER_KEY || '')
  }
  return styles[props.style] || styles.satellite
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
