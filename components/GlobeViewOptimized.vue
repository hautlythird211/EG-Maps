<script setup lang="ts">
/**
 * GlobeViewOptimized - High-performance 3D globe with GPU markers and chunked loading
 * Handles 10,000+ entities with 60fps animations and smooth transitions
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
  zoom: 1.5,
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
const globeContainer = ref<HTMLDivElement | null>(null)
const globe = ref<MapLibreMap | null>(null)
const globeLoaded = ref(false)

// Loading state
const isLoading = ref(true)
const loadingProgress = ref(0)
const loadingPhase = ref<'initializing' | 'fetching' | 'processing' | 'rendering' | 'complete'>('initializing')
const loadingEntities = ref<MapEntity[]>([])
const totalEntities = ref(0)

// Globe rotation state
const rotation = ref({ x: 0, y: 0 })
const isRotating = ref(false)

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
    loadingEntities.value = [...loadingEntities.value, ...chunk as MapEntity[]]
    updateMarkers(chunk as MapEntity[])
  }
})

// External API loader
const apiLoader = useExternalAPI()

/**
 * Initialize globe
 */
const initializeGlobe = async () => {
  if (!globeContainer.value) return

  loadingPhase.value = 'initializing'

  // Create globe (3D perspective view)
  globe.value = new maplibregl.Map({
    container: globeContainer.value,
    style: getGlobeStyle(),
    center: props.center,
    zoom: props.zoom,
    projection: 'globe' as any,
    maxZoom: 8,
    fog: {
      color: 'rgb(186, 210, 235)',
      'high-color': 'rgb(255, 255, 255)',
      'horizon-blend': 0.02,
      'space-color': 'rgb(11, 11, 25)',
      'star-intensity': 0.6
    },
    transformRequest: (url) => {
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

  // Wait for globe to load
  await new Promise<void>((resolve) => {
    globe.value!.on('load', () => {
      globeLoaded.value = true
      resolve()
    })
  })

  // Initialize marker manager
  if (globe.value) {
    markerManager.value = useHighPerformanceMarkers({
      map: globe.value,
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
 * Get globe style URL
 */
const getGlobeStyle = (): string => {
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
      const data = await apiLoader.loadEndpoint('entities', {
        url: props.externalEndpoint
      } as any)
      dataProvider = () => Promise.resolve(data as MapEntity[])
    } else if (props.dataSource === 'species') {
      dataProvider = async () => {
        const response = await fetch('/data/species/index.json')
        const rawData = await response.json()
        return transformSpeciesData(rawData)
      }
    } else {
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
 * Transform species data
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
 * Transform project data
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

  if (!globe.value?.getSource('entities-source')) {
    markerManager.value.initializeGPUMarkers(newEntities)
  } else {
    markerManager.value.updateMarkers(newEntities)
  }
}

/**
 * Set up event handlers
 */
const setupEventHandlers = () => {
  if (!globe.value) return

  // Marker click
  globe.value.on('markerclick' as any, (e: any) => {
    const entity = entities.value.find(ent => ent.id === e.id)
    if (entity) {
      emit('entity-click', entity)
    }
  })

  // Drag rotation
  globe.value.on('dragstart', () => {
    isRotating.value = true
  })

  globe.value.on('dragend', () => {
    isRotating.value = false
    rotation.value = {
      x: globe.value?.getBearing() || 0,
      y: globe.value?.getPitch() || 0
    }
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

// Watch for globe loaded
watch(globeLoaded, (loaded) => {
  if (loaded) {
    setupEventHandlers()
  }
})

// Lifecycle
onMounted(() => {
  nextTick(() => {
    initializeGlobe()
  })
})

onUnmounted(() => {
  if (markerManager.value) {
    markerManager.value.cleanup()
  }
  if (globe.value) {
    globe.value.remove()
  }
})

// Computed
const loadingMessage = computed(() => {
  const messages: Record<string, string> = {
    initializing: 'Initializing 3D globe...',
    fetching: 'Fetching global data...',
    processing: 'Processing entities...',
    rendering: 'Rendering markers...',
    complete: 'Complete!'
  }
  return messages[loadingPhase.value]
})

const entityCount = computed(() => loadingEntities.value.length)
</script>

<template>
  <div class="globe-view-optimized">
    <!-- Loading overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <AnimatedGlobeLoader
          :progress="loadingProgress"
          :size="140"
          :show-progress="true"
          color-scheme="ocean"
        />
        <div class="loading-text">
          <p class="loading-phase">{{ loadingMessage }}</p>
          <p class="loading-count">
            {{ entityCount.toLocaleString() }} / {{ totalEntities.toLocaleString() }} entities
          </p>
          <p class="loading-hint">Drag to rotate globe</p>
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
        <LoadingMarkerBubble type="loading" size="lg" :animated="true" />
        <LoadingMarkerBubble type="project" size="lg" :animated="true" />
        <LoadingMarkerBubble type="species" size="lg" :animated="true" />
      </div>
    </div>

    <!-- Globe container -->
    <div ref="globeContainer" class="globe-container" />

    <!-- Rotation indicator -->
    <div v-if="isRotating" class="rotation-indicator">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 11-6.219-8.56" />
      </svg>
      <span>Rotating</span>
    </div>

    <!-- Performance stats -->
    <div v-if="!isLoading" class="perf-stats">
      <span>{{ fps }} FPS</span>
      <span>{{ entityCount.toLocaleString() }} entities</span>
    </div>
  </div>
</template>

<style scoped>
.globe-view-optimized {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.globe-container {
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
  background: linear-gradient(
    135deg,
    rgba(11, 33, 65, 0.95) 0%,
    rgba(15, 52, 96, 0.95) 100%
  );
  backdrop-filter: blur(12px);
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
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.loading-count {
  font-size: 14px;
  opacity: 0.9;
  margin: 0 0 4px 0;
}

.loading-hint {
  font-size: 12px;
  opacity: 0.7;
  margin: 0;
  font-style: italic;
}

.loading-progress-bar {
  width: 240px;
  height: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  overflow: hidden;
}

.loading-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #22d3ee, #8b5cf6);
  transition: width 0.3s ease-out;
  box-shadow: 0 0 12px rgba(14, 165, 233, 0.5);
}

.loading-markers-demo {
  position: absolute;
  bottom: 32px;
  display: flex;
  gap: 20px;
}

/* Rotation indicator */
.rotation-indicator {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: fade-in 0.3s ease;
}

.rotation-indicator svg {
  animation: spin 1s linear infinite;
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

/* Animations */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
