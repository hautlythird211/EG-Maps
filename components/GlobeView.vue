<template>
  <div class="w-full h-screen relative overflow-hidden bg-black" role="main" aria-label="3D Globe Visualization">
    <!-- Loading skeleton -->
    <Transition name="fade">
      <div v-if="isLoading" class="absolute inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center">
        <div class="relative mb-6">
          <div class="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <div class="absolute inset-0 w-20 h-20 rounded-full border-4 border-purple-500/20 border-b-purple-500 animate-spin" style="animation-delay: 0.5s; animation-direction: reverse" />
          <div class="absolute inset-0 flex items-center justify-center">
            <Icon name="lucide:globe" class="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <p class="text-cyan-400 font-medium mb-2">{{ t('globe.loading') }}</p>
        <p class="text-gray-500 text-sm">{{ t('globe.preparingData', { dataset: activeDataset === 'project-grants' ? t('home.projectGrants').toLowerCase() : t('home.species').toLowerCase() }) }}</p>
        <div class="mt-4 flex gap-1">
          <div class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 0ms" />
          <div class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 150ms" />
          <div class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 300ms" />
        </div>
      </div>
    </Transition>

    <!-- Star field background -->
    <div class="star-field" aria-hidden="true"></div>

    <!-- Black void overlay for globe edges -->
    <div class="absolute inset-0 pointer-events-none z-10 bg-black/40"></div>

    <!-- Subtle radial glow behind globe -->
    <div class="absolute inset-0 pointer-events-none z-10 bg-gradient-radial from-cyan-900/10 via-transparent to-transparent"></div>

    <!-- Atmospheric glow effect -->
    <div class="absolute inset-0 pointer-events-none z-10">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-r from-cyan-500/10 via-purple-500/5 to-emerald-500/10 blur-3xl animate-pulse-slow" />
    </div>

    <!-- Vignette -->
    <div class="absolute inset-0 pointer-events-none z-20" style="box-shadow: inset 0 0 200px 40px rgba(0,0,0,0.9)"></div>

    <!-- Grid overlay with image-set for 2x resolution -->
    <div
      class="absolute inset-0 pointer-events-none opacity-[0.03]"
      :style="{
        zIndex: 'calc(var(--z-map-effects) + 1)',
        backgroundImage: 'image-set(url(/grid-overlay.png) 1x, url(/grid-overlay.png) 2x)',
        backgroundRepeat: 'repeat',
      }"
    />

    <!-- Noise overlay with image-set for 2x resolution -->
    <div
      class="absolute inset-0 pointer-events-none opacity-[0.02] animate-noise-bg"
      :style="{
        zIndex: 'calc(var(--z-map-effects) + 2)',
        backgroundImage: 'image-set(url(/noise.png) 1x, url(/noise.png) 2x)',
        backgroundRepeat: 'repeat',
      }"
    />

    <!-- Scanline overlay with image-set for 2x resolution -->
    <div
      class="absolute inset-0 pointer-events-none opacity-[0.015]"
      :style="{
        zIndex: 'calc(var(--z-map-effects) + 3)',
        backgroundImage: 'image-set(url(/scanline.gif) 1x, url(/scanline.gif) 2x)',
        backgroundRepeat: 'repeat',
      }"
    />

    <!-- Hex grid overlay -->
    <canvas
      v-if="isHexGridVisible"
      ref="hexCanvasRef"
      class="absolute inset-0 w-full h-full pointer-events-none opacity-15"
      :style="{ zIndex: 'var(--z-map-hex-grid)' }"
    />

    <!-- Map container -->
    <div ref="containerRef" class="w-full h-full" />

    <!-- White Banner -->
    <div v-if="isMobile" class="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none px-2" :style="{ zIndex: 'var(--z-map-banner)' }">
      <img src="/white-banner.png" alt="Earth Guardians" class="h-auto w-auto max-h-[12vh] max-w-[240px] object-contain" loading="lazy" />
    </div>
    <div v-else class="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block" :style="{ zIndex: 'var(--z-map-banner)' }">
      <img src="/white-banner.png" alt="Earth Guardians" class="h-auto w-auto max-h-[15vh] max-w-[180px] -rotate-90 origin-center" loading="lazy" />
    </div>

    <!-- Global Stats (only shown for project grants) -->
    <div v-if="activeDataset === 'project-grants'" class="absolute right-0 bottom-0 z-[1000] w-full max-w-xl px-4 sm:px-0">
      <GlobalStats :projects="projectsData" @close="() => {}" />
    </div>

    <!-- Species legend (for endangered species) -->
    <div v-if="activeDataset === 'endangered-species'" class="absolute left-4 bottom-20 sm:bottom-4 z-[600]">
      <div class="panel-cyber rounded-lg p-3 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
        <h3 class="text-xs font-bold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
          <Icon name="lucide:layers" class="h-3.5 w-3.5 text-cyan-400" />
          {{ t('globe.taxonomicGroups') }}
        </h3>
        <div class="grid grid-cols-2 gap-1.5">
          <div v-for="(color, group) in GROUP_COLORS" :key="group" class="flex items-center gap-1.5 group cursor-pointer">
            <div class="w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover:scale-125" :style="{ backgroundColor: color }" />
            <span class="text-[10px] text-[var(--text-secondary)] group-hover:text-cyan-400 transition-colors">{{ group }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Controls -->
    <MapControls
      :is-globe-view="true"
      :show-hex-grid="isHexGridVisible"
      :show-connections="showConnections"
      :dataset="activeDataset"
      :projects="activeDataset === 'project-grants' ? projectsData : undefined"
      :species="activeDataset === 'endangered-species' ? speciesData : undefined"
      :style="{ zIndex: 'var(--z-map-ui-controls)' }"
      @toggle-hex-grid="isHexGridVisible = !isHexGridVisible"
      @toggle-connections="toggleConnections"
      @navigate="navigateToLocation"
    />

    <!-- Error state -->
    <Transition name="fade">
      <div v-if="hasError" class="absolute inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center text-white z-[2000]">
        <div class="relative mb-6">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-orange-600 animate-pulse" />
          <Icon name="lucide:alert-triangle" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-white" />
        </div>
        <h2 class="text-xl font-bold mb-2">{{ t('globe.unableToLoad') }}</h2>
        <p class="text-gray-400 mb-4 text-center px-4 max-w-md">{{ t('globe.connectionError') }}</p>
        <button @click="() => { hasError = false; initMap() }" class="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2">
          <Icon name="lucide:refresh-cw" class="h-4 w-4" />
          {{ t('globe.tryAgain') }}
        </button>
      </div>
    </Transition>

    <!-- Detached fullscreen species popup overlay -->
    <div v-if="showSpeciesOverlay" class="species-popup-overlay-fixed" @click.self="closeSpeciesOverlay">
      <button class="species-popup-close-btn-fixed" @click="closeSpeciesOverlay">&times;</button>
      <div class="species-popup-content-fixed" v-html="speciesOverlayHTML"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import maplibregl from 'maplibre-gl'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useI18n } from '@/composables/useI18n'
import { allProjectsData } from '@/lib/project-data'
import type { ProjectData } from '@/lib/types'
import { isValidCoordinate, GROUP_COLORS, buildProjectPopupHTML, buildSpeciesPopupHTML } from '@/lib/map-utils'
import { getProjectColorByBeneficiaries } from '@/lib/colors'
import type { Species } from '@/lib/map-utils'
import {
  buildMapConnectionFeatures,
  createMapParticleSystem,
  syncMapConnectionLayers,
  type MapConnectionFeature,
  type MapParticleSystem,
} from '@/lib/map-effects'
import {
  getMarkerImageUrl,
  preloadSpeciesImages,
  clearImageCache,
} from '@/lib/image-utils'

const { t, locale } = useI18n()

function getLocalizedSpecies(species: Species): Species {
  const content = species.content?.[locale.value] ?? species.content?.en
  if (!content) return species

  return {
    ...species,
    description: content.description ?? species.description,
    endangerment: content.endangerment ?? species.endangerment,
    ecosystemNeeds: content.ecosystemNeeds ?? species.ecosystemNeeds,
    actions: content.actions ?? species.actions,
    region: content.region ?? species.region,
  }
}

function getTaxonomicGroupLabels() {
  return Object.keys(GROUP_COLORS).reduce<Record<string, string>>((labels, group) => {
    labels[group] = t(`taxonomy.${group}`)
    return labels
  }, {})
}

interface Props {
  projects?: ProjectData[]
  species?: Species[]
  showHexGrid?: boolean
  defaultDataset?: 'project-grants' | 'endangered-species'
}

const props = withDefaults(defineProps<Props>(), {
  showHexGrid: true,
  defaultDataset: 'project-grants',
})

const projectsData = computed(() => props.projects || allProjectsData)
const speciesData = computed(() => props.species || [])

const datasetBaseRoute = computed(() => {
  return activeDataset.value === 'project-grants' ? '/project-grants' : '/endangered-species'
})

const isMobile = useMediaQuery('(max-width: 768px)')
const containerRef = ref<HTMLDivElement | null>(null)
const hexCanvasRef = ref<HTMLCanvasElement | null>(null)
const hasError = ref(false)
const isLoading = ref(true)
const activeDataset = ref<'project-grants' | 'endangered-species'>(props.defaultDataset)
const isHexGridVisible = ref(props.showHexGrid)
const showConnections = ref(true)
const showSpeciesOverlay = ref(false)
const speciesOverlayHTML = ref('')

let map: maplibregl.Map | null = null
let markers: maplibregl.Marker[] = []
let isMounted = true
let pendingVisibilityUpdate = false
let connectionFeatures: MapConnectionFeature[] = []
let particleSystem: MapParticleSystem | null = null

function openSpeciesOverlay(species: Species) {
  const localizedSpecies = getLocalizedSpecies(species)
  const speciesPopupTranslations = {
    scientificName: t('species.scientificName'),
    threatTypes: t('species.threatTypes'),
    population: t('species.population'),
    habitat: t('species.habitat'),
    region: t('filter.region'),
    ecosystem: t('filter.ecosystem'),
    groupLabels: getTaxonomicGroupLabels()
  }
  speciesOverlayHTML.value = buildSpeciesPopupHTML(localizedSpecies, speciesPopupTranslations)
  showSpeciesOverlay.value = true
}

function closeSpeciesOverlay() {
  showSpeciesOverlay.value = false
  speciesOverlayHTML.value = ''
}

const MAPTILER_API_KEY = useRuntimeConfig().public.maptilerApiKey || ''

const MAP_STYLE = MAPTILER_API_KEY
  ? `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`
  : 'https://demotiles.maplibre.org/style.json'

const tileCache = new Map<string, Response>()

function transformRequest(url: string, resourceType?: string) {
  if (resourceType === 'Tile' && tileCache.has(url)) {
    const cached = tileCache.get(url)!
    return {
      url,
      headers: {},
      method: 'GET',
      type: 'image' as const,
      credentials: 'same-origin' as const,
      collectResourceTiming: false,
      _cachedResponse: cached,
    }
  }
  return { url }
}

async function initMap() {
  if (typeof window === 'undefined' || !containerRef.value) return

  isLoading.value = true

  try {
    map = new maplibregl.Map({
      container: containerRef.value,
      style: MAP_STYLE,
      zoom: isMobile.value ? 1.5 : 2.5,
      center: [0, 20],
      attributionControl: false,
      renderWorldCopies: false,
      fadeDuration: 100,
      maxTileCacheSize: 200,
      maxTileCacheZoomLevels: 5,
      transformRequest,
      antialias: true,
    })

    map.addControl(
      new maplibregl.AttributionControl({
        customAttribution: `EARTH GUARDIANS @ ${new Date().getFullYear()}`
      })
    )

    map.on('style.load', () => {
      if (map) {
        try {
          map.setProjection({ type: 'globe' } as any)
        } catch (e) {
          console.error('Error setting globe projection:', e)
        }
      }
    })

    map.on('load', () => {
      isLoading.value = false
      rebuildMarkers()
      addConnections()
      startParticles()
      setupHexGrid()
      startMarkerVisibilityCheck()
    })

    map.on('move', () => {
      // Throttle with RAF - only process visibility once per frame
      if (!pendingVisibilityUpdate) {
        pendingVisibilityUpdate = true
        requestAnimationFrame(() => {
          updateMarkerVisibility()
          pendingVisibilityUpdate = false
        })
      }
    })

    map.on('moveend', () => {
      updateMarkerVisibility()
    })

    let errorCount = 0
    let usedFallback = false

    map.on('error', (err) => {
      console.error('MapLibre error:', err)
      errorCount++
      // Retry with fallback style once if we get tile/style load errors
      if (!usedFallback && errorCount >= 2 && MAP_STYLE.includes('maptiler.com')) {
        usedFallback = true
        console.warn('MapTiler style failed, falling back to demotiles style')
        map.setStyle('https://demotiles.maplibre.org/style.json')
        return
      }
      isLoading.value = false
      hasError.value = true
    })

    // Timeout fallback for loading
    setTimeout(() => {
      if (isLoading.value) {
        isLoading.value = false
      }
    }, 10000)
  } catch (err) {
    console.error('Failed to load maplibre-gl:', err)
    isLoading.value = false
    hasError.value = true
  }
}

function getUnifiedMarkerMetrics(options: {
  color: string
  size: number
  centerScale?: number
  imageUrl?: string
  originalImageUrl?: string
}) {
  const hitSize = Math.max(34, Math.round(options.size + 12))
  const visualSize = Math.round(options.size)

  return {
    hitSize,
    visualSize,
    color: options.color,
    centerSize: Math.max(7, Math.round(visualSize * (options.centerScale ?? 0.42))),
    imageUrl: options.imageUrl,
    originalImageUrl: options.originalImageUrl,
  }
}

function createUnifiedMarkerElement(metrics: ReturnType<typeof getUnifiedMarkerMetrics>) {
  const el = document.createElement('div')
  el.className = 'globe-marker-item'
  el.style.width = `${metrics.hitSize}px`
  el.style.height = `${metrics.hitSize}px`
  el.style.display = 'flex'
  el.style.justifyContent = 'center'
  el.style.alignItems = 'center'
  el.style.cursor = 'pointer'
  el.style.pointerEvents = 'auto'
  el.style.zIndex = '10'

  const inner = document.createElement('div')
  inner.style.width = `${metrics.visualSize}px`
  inner.style.height = `${metrics.visualSize}px`
  inner.style.borderRadius = '50%'
  inner.style.backgroundColor = 'rgba(0, 0, 0, 0.82)'
  inner.style.border = '2px solid rgba(255, 255, 255, 0.86)'
  inner.style.boxShadow = `0 0 ${Math.max(8, metrics.visualSize * 0.5)}px ${metrics.color}, 0 0 1.5px #fff`
  inner.style.display = 'flex'
  inner.style.justifyContent = 'center'
  inner.style.alignItems = 'center'
  inner.style.position = 'relative'
  inner.style.overflow = 'hidden'
  inner.style.transition = 'transform 160ms ease, box-shadow 160ms ease'
  inner.style.transformOrigin = 'center center'
  inner.style.transform = 'scale(1)'

  if (metrics.originalImageUrl) {
    const thumbUrl = getMarkerImageUrl(metrics.originalImageUrl)
    if (thumbUrl) {
      inner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.18)), url("${thumbUrl}")`
      inner.style.backgroundSize = 'cover'
      inner.style.backgroundPosition = 'center'
    }
  } else if (metrics.imageUrl) {
    inner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.18)), url("${metrics.imageUrl}")`
    inner.style.backgroundSize = 'cover'
    inner.style.backgroundPosition = 'center'
  } else {
    const centerDot = document.createElement('div')
    centerDot.style.width = `${metrics.centerSize}px`
    centerDot.style.height = `${metrics.centerSize}px`
    centerDot.style.backgroundColor = metrics.color
    centerDot.style.borderRadius = '50%'
    centerDot.style.boxShadow = `0 0 ${Math.max(3, metrics.centerSize * 0.5)}px ${metrics.color}`
    inner.appendChild(centerDot)
  }

  el.appendChild(inner)

  el.addEventListener('mouseenter', () => {
    inner.style.transform = 'scale(1.28)'
    inner.style.boxShadow = `0 0 ${Math.max(16, metrics.visualSize * 0.9)}px ${metrics.color}, 0 0 4px #fff`
    el.style.zIndex = '100'
  })

  el.addEventListener('mouseleave', () => {
    inner.style.transform = 'scale(1)'
    inner.style.boxShadow = `0 0 ${Math.max(8, metrics.visualSize * 0.5)}px ${metrics.color}, 0 0 1.5px #fff`
    el.style.zIndex = '10'
  })

  return el
}

function createProjectMarkerElement(project: ProjectData): HTMLElement {
  const beneficiaryFactor = Math.min(Math.max(project.indirect_beneficiaries / 10000, 0.5), 5)
  const markerSize = 15 + beneficiaryFactor * 10
  const color = getProjectColorByBeneficiaries(project.direct_beneficiaries, project.indirect_beneficiaries)

  return createUnifiedMarkerElement(getUnifiedMarkerMetrics({ color, size: markerSize }))
}

function createSpeciesMarkerElement(species: Species): HTMLElement {
  const color = GROUP_COLORS[species.taxonomicGroup] ?? '#B64030'
  return createUnifiedMarkerElement(getUnifiedMarkerMetrics({
    color,
    size: species.imageUrl ? 26 : 20,
    centerScale: 0.62,
    originalImageUrl: species.imageUrl || undefined,
  }))
}

function updateMarkerVisibility() {
  if (!map) return

  const canvas = map.getCanvas()
  const margin = 50
  const bounds = {
    minX: -margin,
    maxX: canvas.width + margin,
    minY: -margin,
    maxY: canvas.height + margin
  }

  // Batch DOM updates - only change what actually changed
  markers.forEach(marker => {
    const el = marker.getElement()
    try {
      const point = map!.project(marker.getLngLat())
      if (!point || isNaN(point.x) || isNaN(point.y)) {
        el.style.display = 'none'
        el.style.pointerEvents = 'none'
        return
      }

      const isVisible = (
        point.x >= bounds.minX &&
        point.x <= bounds.maxX &&
        point.y >= bounds.minY &&
        point.y <= bounds.maxY
      )

      // Only update DOM if state changed
      const wasVisible = el.style.display !== 'none'
      if (isVisible !== wasVisible) {
        el.style.display = isVisible ? '' : 'none'
        el.style.pointerEvents = isVisible ? '' : 'none'
      }
    } catch {
      el.style.display = 'none'
      el.style.pointerEvents = 'none'
    }
  })
}

function startMarkerVisibilityCheck() {
  // RAF-based updates handle this during interaction
}

function rebuildMarkers() {
  if (!map) return

  markers.forEach(m => m.remove())
  markers = []

  // Translation objects for popups
  const projectPopupTranslations = {
    projectGrantee: t('stats.projectGrantees'),
    directBeneficiaries: t('stats.directBeneficiaries'),
    indirectBeneficiaries: t('stats.indirectBeneficiaries'),
    location: t('project.location'),
    status: t('project.status'),
    unknownLocation: t('project.unknownLocation')
  }
  const speciesPopupTranslations = {
    scientificName: t('species.scientificName'),
    threatTypes: t('species.threatTypes'),
    population: t('species.population'),
    habitat: t('species.habitat'),
    region: t('filter.region'),
    ecosystem: t('filter.ecosystem'),
    groupLabels: getTaxonomicGroupLabels()
  }

  if (activeDataset.value === 'project-grants') {
    const data = isMobile.value
      ? projectsData.value.slice(0, 60)
      : projectsData.value

    data.forEach((project) => {
      if (!isValidCoordinate(project.latitude, project.longitude)) return

      const el = createProjectMarkerElement(project)
      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: isMobile.value ? '260px' : '300px',
        className: 'cyberpunk-popup',
        offset: 15,
      }).setHTML(buildProjectPopupHTML(project, projectPopupTranslations))

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([project.longitude, project.latitude])
        .setPopup(popup)
        .addTo(map!)

      markers.push(marker)
    })
  } else if (activeDataset.value === 'endangered-species' && speciesData.value.length) {
    const data = isMobile.value
      ? speciesData.value.slice(0, 80)
      : speciesData.value

    const speciesToRender = data.filter(s => isValidCoordinate(s.lat, s.lng))
    const imageUrls = speciesToRender.map(s => s.imageUrl).filter(Boolean)
    
    preloadSpeciesImages(imageUrls, true)

    speciesToRender.forEach((species) => {
      const el = createSpeciesMarkerElement(species)
      el.style.cursor = 'pointer'
      el.addEventListener('click', () => {
        openSpeciesOverlay(species)
      })

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([species.lng, species.lat])
        .addTo(map!)

      markers.push(marker)
    })
  }

  updateMarkerVisibility()
}

function addConnections() {
  if (!map) return

  cleanupParticles()

  if (!showConnections.value) {
    connectionFeatures = []
    syncMapConnectionLayers(map, [])
    return
  }

  connectionFeatures = buildMapConnectionFeatures({
    dataset: activeDataset.value,
    projects: projectsData.value,
    species: speciesData.value,
    isMobile: isMobile.value,
  })

  syncMapConnectionLayers(map, connectionFeatures)
}

function cleanupParticles() {
  particleSystem?.stop()
  particleSystem = null
}

function startParticles() {
  if (!showConnections.value || !isMounted || !map || !containerRef.value || !connectionFeatures.length) return

  cleanupParticles()

  particleSystem = createMapParticleSystem({
    map,
    container: containerRef.value,
    getFeatures: () => connectionFeatures,
    isMobile: () => isMobile.value,
    zIndex: 30,
  })
  particleSystem.start()
}

function toggleConnections() {
  showConnections.value = !showConnections.value
}

function navigateToLocation(lat: number, lng: number) {
  if (map) {
    map.flyTo({ center: [lng, lat], zoom: isMobile.value ? 3 : 4, duration: 1500, essential: true })
  }
}

function setupHexGrid() {
  const canvas = hexCanvasRef.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.style.width = `${window.innerWidth}px`
  canvas.style.height = `${window.innerHeight}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  const hexSize = isMobile.value ? 30 : 45
  const hexHeight = hexSize * Math.sqrt(3)
  const hexWidth = hexSize * 2
  const hexVerticalOffset = hexHeight * 0.75
  const hexHorizontalOffset = hexWidth * 0.5
  const columns = Math.ceil(window.innerWidth / hexHorizontalOffset) + 1
  const rows = Math.ceil(window.innerHeight / hexVerticalOffset) + 1

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)'
  ctx.lineWidth = 1

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = col * hexHorizontalOffset
      const y = row * hexVerticalOffset + (col % 2 === 0 ? 0 : hexHeight / 2)
      if (x < -hexWidth || x > window.innerWidth + hexWidth || y < -hexHeight || y > window.innerHeight + hexHeight) continue

      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i
        const hx = x + hexSize * Math.cos(angle)
        const hy = y + hexSize * Math.sin(angle)
        if (i === 0) ctx.moveTo(hx, hy)
        else ctx.lineTo(hx, hy)
      }
      ctx.closePath()
      ctx.stroke()
    }
  }
}

let hexGridDebounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSetupHexGrid() {
  if (hexGridDebounceTimer) clearTimeout(hexGridDebounceTimer)
  hexGridDebounceTimer = setTimeout(() => {
    setupHexGrid()
    hexGridDebounceTimer = null
  }, 200)
}

if (typeof document !== 'undefined' && !document.getElementById('globe-styles')) {
  const style = document.createElement('style')
  style.id = 'globe-styles'
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0; }
      50% { transform: scale(1.1); opacity: 0.4; }
      100% { transform: scale(0.95); opacity: 0; }
    }
    .maplibregl-popup-content {
      background: rgba(0, 0, 0, 0.95) !important;
      border-radius: 8px !important;
      border: 1px solid rgba(6, 182, 212, 0.4) !important;
      box-shadow: 0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 15px rgba(6, 182, 212, 0.05) !important;
      padding: 0 !important;
      min-width: 260px;
    }
    .maplibregl-popup-tip {
      border-top-color: rgba(6, 182, 212, 0.7) !important;
      border-bottom-color: rgba(6, 182, 212, 0.7) !important;
    }
    .maplibregl-popup-close-button {
      color: rgba(6, 182, 212, 0.8) !important;
      font-size: 18px !important;
      padding: 4px 8px !important;
      background: transparent !important;
      border: none !important;
      top: 8px !important;
      right: 8px !important;
    }
    .maplibregl-popup-close-button:hover {
      background-color: rgba(6, 182, 212, 0.2) !important;
      color: rgba(6, 182, 212, 1) !important;
    }
    .maplibregl-ctrl-bottom-right {
      margin-bottom: 5px;
      margin-right: 5px;
    }
    .maplibregl-ctrl-attrib-inner {
      color: rgba(255, 255, 255, 0.6);
      font-size: 10px;
      background-color: rgba(0, 0, 0, 0.6) !important;
    }
    .maplibregl-ctrl-attrib-inner a {
      color: rgba(6, 182, 212, 0.7);
      text-decoration: none;
    }
    .maplibregl-map {
      background-color: transparent !important;
    }
    .globe-marker-item {
      transform: translateZ(0);
    }
    .star-field {
      position: absolute;
      inset: 0;
      z-index: 0;
      background: #000;
    }
    .star-field::before,
    .star-field::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-repeat: repeat;
    }
    .star-field::before {
      background-image:
        radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.9), transparent),
        radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.7), transparent),
        radial-gradient(1.5px 1.5px at 40% 10%, rgba(255,255,255,1), transparent),
        radial-gradient(1px 1px at 55% 45%, rgba(255,255,255,0.6), transparent),
        radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.8), transparent),
        radial-gradient(1.5px 1.5px at 85% 55%, rgba(255,255,255,0.9), transparent),
        radial-gradient(1px 1px at 15% 70%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 30% 85%, rgba(255,255,255,0.7), transparent),
        radial-gradient(1.5px 1.5px at 50% 65%, rgba(255,255,255,0.8), transparent),
        radial-gradient(1px 1px at 65% 80%, rgba(255,255,255,0.6), transparent),
        radial-gradient(1px 1px at 80% 90%, rgba(255,255,255,0.9), transparent),
        radial-gradient(1px 1px at 95% 40%, rgba(255,255,255,0.7), transparent),
        radial-gradient(1.5px 1.5px at 5% 50%, rgba(255,255,255,1), transparent),
        radial-gradient(1px 1px at 20% 25%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 45% 90%, rgba(255,255,255,0.8), transparent),
        radial-gradient(1px 1px at 60% 5%, rgba(255,255,255,0.6), transparent),
        radial-gradient(1.5px 1.5px at 75% 35%, rgba(255,255,255,0.9), transparent),
        radial-gradient(1px 1px at 90% 75%, rgba(255,255,255,0.7), transparent),
        radial-gradient(1px 1px at 35% 55%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 50% 30%, rgba(255,255,255,0.8), transparent);
      background-size: 200px 200px;
      animation: twinkle 4s ease-in-out infinite alternate;
    }
    .star-field::after {
      background-image:
        radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.6), transparent),
        radial-gradient(1.5px 1.5px at 28% 48%, rgba(255,255,255,0.9), transparent),
        radial-gradient(1px 1px at 42% 8%, rgba(255,255,255,0.7), transparent),
        radial-gradient(1px 1px at 58% 52%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.5px 1.5px at 72% 18%, rgba(255,255,255,1), transparent),
        radial-gradient(1px 1px at 88% 62%, rgba(255,255,255,0.8), transparent),
        radial-gradient(1px 1px at 8% 78%, rgba(255,255,255,0.6), transparent),
        radial-gradient(1px 1px at 38% 92%, rgba(255,255,255,0.7), transparent),
        radial-gradient(1.5px 1.5px at 52% 38%, rgba(255,255,255,0.9), transparent),
        radial-gradient(1px 1px at 68% 72%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 82% 88%, rgba(255,255,255,0.8), transparent),
        radial-gradient(1px 1px at 98% 32%, rgba(255,255,255,0.6), transparent),
        radial-gradient(1.5px 1.5px at 18% 58%, rgba(255,255,255,1), transparent),
        radial-gradient(1px 1px at 32% 12%, rgba(255,255,255,0.7), transparent),
        radial-gradient(1px 1px at 48% 82%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 62% 28%, rgba(255,255,255,0.9), transparent),
        radial-gradient(1.5px 1.5px at 78% 42%, rgba(255,255,255,0.8), transparent),
        radial-gradient(1px 1px at 92% 68%, rgba(255,255,255,0.6), transparent),
        radial-gradient(1px 1px at 22% 95%, rgba(255,255,255,0.7), transparent),
        radial-gradient(1px 1px at 55% 15%, rgba(255,255,255,0.5), transparent);
      background-size: 250px 250px;
      animation: twinkle 5s ease-in-out infinite alternate-reverse;
    }
    @keyframes twinkle {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.7; }
    }
    /* Project Popup Styles */
    .project-popup-wrapper {
      padding: 16px;
      min-width: 260px;
      width: min(420px, calc(100vw - 32px));
      max-width: calc(100vw - 32px);
      word-wrap: break-word;
      white-space: normal;
      overflow: hidden;
    }
    .project-popup-header {
      position: relative;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .project-corner-accent {
      position: absolute;
      width: 12px;
      height: 12px;
      border: 2px solid rgba(6, 182, 212, 0.5);
    }
    .project-corner-accent.top-left {
      top: -4px;
      left: -4px;
      border-right: none;
      border-bottom: none;
    }
    .project-corner-accent.top-right {
      top: -4px;
      right: -4px;
      border-left: none;
      border-bottom: none;
    }
    .project-header-content {
      position: relative;
      z-index: 1;
    }
    .project-status-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .project-badge {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(6, 182, 212, 0.9);
      background: rgba(6, 182, 212, 0.1);
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }
    .project-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      box-shadow: 0 0 8px currentColor;
    }
    .project-title {
      font-size: 14px;
      font-weight: 600;
      color: #f0f0f0;
      line-height: 1.4;
      margin: 0;
    }
    .project-header-line {
      height: 1px;
      background: linear-gradient(90deg, rgba(6, 182, 212, 0.4), rgba(168, 85, 247, 0.4), transparent);
      margin-top: 12px;
    }
    .project-popup-body {
      padding: 0 4px;
    }
    .project-stat-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 12px;
    }
    .project-stat-icon {
      color: rgba(6, 182, 212, 0.7);
      margin-top: 2px;
      flex-shrink: 0;
    }
    .project-stat-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .project-stat-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .project-stat-value {
      font-size: 13px;
      color: #d1d5db;
    }
    .project-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 12px 0;
    }
    .project-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .project-metric {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .project-metric-header {
      display: flex;
      align-items: center;
      gap: 6px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .project-metric-value {
      font-size: 16px;
      font-weight: 600;
    }
    .project-metric-value.direct {
      color: #22d3ee;
    }
    .project-metric-value.indirect {
      color: #a855f7;
    }
    .project-popup-footer {
      margin-top: 12px;
      height: 3px;
      position: relative;
    }
    .project-footer-glow {
      height: 100%;
      width: 60%;
      opacity: 0.4;
      filter: blur(2px);
    }
    /* Species Popup Styles */
    .species-popup-wrapper {
      padding: 0;
      min-width: 280px;
      width: min(560px, calc(100vw - 32px));
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 60px);
      overflow-y: auto;
      overflow-x: hidden;
      word-wrap: break-word;
      white-space: normal;
    }
    .species-header {
      position: relative;
      padding: 16px;
      border-bottom: 1px solid;
      background: rgba(0, 0, 0, 0.3);
    }
    .species-header-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .species-ornament {
      margin-bottom: 8px;
    }
    .species-ornament.top {
      margin-bottom: 12px;
    }
    .species-ornament.bottom {
      margin-top: 12px;
      margin-bottom: 0;
    }
    .species-badges {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .species-category-badge {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: white;
      padding: 3px 10px;
      border-radius: 4px;
    }
    .species-group-badge {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 4px;
      border: 1px solid;
      background: transparent;
    }
    .species-common-name {
      font-size: 16px;
      font-weight: 600;
      color: #f5f5f5;
      margin: 0 0 4px 0;
      line-height: 1.3;
      position: relative;
      z-index: 1;
    }
    .species-scientific-name {
      font-size: 12px;
      font-style: italic;
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
      position: relative;
      z-index: 1;
    }
    .species-body {
      padding: 14px 16px;
    }
    .species-description {
      font-size: 12px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.75);
      margin: 0 0 14px 0;
      max-height: 80px;
      overflow-y: auto;
    }
    .species-details {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .species-detail-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .species-detail-row.endangerment {
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 4px;
    }
    .species-detail-icon {
      color: rgba(6, 182, 212, 0.8);
      margin-top: 1px;
      flex-shrink: 0;
    }
    .species-detail-content {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
    }
    .species-detail-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .species-detail-value {
      font-size: 12px;
      color: #d1d5db;
    }
    .species-threat-tag {
      display: inline-block;
      font-size: 10px;
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      padding: 2px 6px;
      border-radius: 3px;
      margin-right: 4px;
      margin-bottom: 4px;
    }
    .endangerment-value {
      font-weight: 600;
    }
    .species-footer {
      padding: 0 16px 12px;
    }
    .species-footer-line {
      height: 2px;
      opacity: 0.6;
    }
    /* Fullscreen detached species popup overlay */
    .species-popup-overlay-fixed {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: overlayFadeIn 0.2s ease-out;
    }
    @keyframes overlayFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .species-popup-close-btn-fixed {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      width: 44px;
      height: 44px;
      border: 2px solid rgba(6, 182, 212, 0.5);
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.7);
      color: #06b6d4;
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
    }
    .species-popup-close-btn-fixed:hover {
      background: rgba(6, 182, 212, 0.2);
      border-color: #06b6d4;
      transform: scale(1.1);
    }
    .species-popup-content-fixed {
      width: 100%;
      max-width: min(700px, calc(100vw - 32px));
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      overflow-x: hidden;
      border-radius: 16px;
      background: rgba(10, 10, 15, 0.95);
      border: 1px solid rgba(6, 182, 212, 0.2);
      box-shadow: 0 0 60px rgba(6, 182, 212, 0.15), 0 25px 50px rgba(0, 0, 0, 0.5);
      animation: contentSlideIn 0.25s ease-out;
    }
    @keyframes contentSlideIn {
      from { opacity: 0; transform: scale(0.95) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .species-popup-content-fixed .species-popup-wrapper {
      width: 100%;
      max-width: 100%;
      max-height: none;
      padding: 0;
    }
    .species-popup-content-fixed .species-image-frame {
      height: clamp(180px, 30vh, 320px);
      width: 100%;
      border-radius: 16px 16px 0 0;
      border-bottom: 2px solid;
    }
    .species-popup-content-fixed .species-header {
      padding: clamp(16px, 3vw, 24px);
    }
    .species-popup-content-fixed .species-common-name {
      font-size: clamp(20px, 3vw, 28px);
    }
    .species-popup-content-fixed .species-scientific-name {
      font-size: clamp(14px, 2vw, 18px);
    }
    .species-popup-content-fixed .species-body {
      padding: clamp(16px, 3vw, 24px);
    }
    .species-popup-content-fixed .species-description {
      font-size: clamp(14px, 2vw, 16px);
      line-height: 1.7;
      max-height: none;
      overflow: visible;
    }
    .species-popup-content-fixed .species-detail-row {
      gap: 12px;
    }
    .species-popup-content-fixed .species-detail-icon {
      width: 20px;
      height: 20px;
    }
    .species-popup-content-fixed .species-detail-icon svg {
      width: 18px;
      height: 18px;
    }
    .species-popup-content-fixed .species-detail-label {
      font-size: clamp(11px, 1.5vw, 13px);
    }
    .species-popup-content-fixed .species-detail-value {
      font-size: clamp(13px, 2vw, 15px);
    }
    .species-popup-content-fixed .species-threat-tag {
      font-size: clamp(11px, 1.5vw, 13px);
      padding: 4px 8px;
    }
    @media (max-width: 640px) {
      .species-popup-overlay-fixed {
        padding: 0;
      }
      .species-popup-content-fixed {
        max-width: 100vw;
        max-height: 100vh;
        border-radius: 0;
        border: none;
      }
      .species-popup-content-fixed .species-image-frame {
        height: 220px;
        border-radius: 0;
      }
      .species-popup-close-btn-fixed {
        top: 12px;
        right: 12px;
        width: 40px;
        height: 40px;
        font-size: 24px;
      }
    }
    .species-popup-content-fixed::-webkit-scrollbar {
      width: 8px;
    }
    .species-popup-content-fixed::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.4);
    }
    .species-popup-content-fixed::-webkit-scrollbar-thumb {
      background: rgba(6, 182, 212, 0.5);
      border-radius: 4px;
    }
    .species-popup-content-fixed::-webkit-scrollbar-thumb:hover {
      background: rgba(6, 182, 212, 0.7);
    }
  `
  document.head.appendChild(style)
}

// Add fade transition and gradient animation
if (typeof document !== 'undefined' && !document.getElementById('globe-transition-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'globe-transition-styles'
  styleSheet.textContent = `
    .fade-enter-active,
    .fade-leave-active {
      transition: opacity 0.3s ease;
    }
    .fade-enter-from,
    .fade-leave-to {
      opacity: 0;
    }
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .animate-gradient-shift {
      background-size: 200% 200%;
      animation: gradientShift 8s ease infinite;
    }
  `
  document.head.appendChild(styleSheet)
}

onMounted(() => {
  initMap()
  window.addEventListener('resize', debouncedSetupHexGrid)
})

watch(locale, () => {
  rebuildMarkers()
})

watch(isHexGridVisible, async (visible) => {
  if (!visible) return
  await nextTick()
  setupHexGrid()
})

watch(showConnections, () => {
  addConnections()
  if (showConnections.value) startParticles()
})

onUnmounted(() => {
  isMounted = false
  cleanupParticles()
  if (hexGridDebounceTimer) clearTimeout(hexGridDebounceTimer)
  markers.forEach(m => m.remove())
  clearImageCache()
  if (map) {
    map.remove()
    map = null
  }
  window.removeEventListener('resize', debouncedSetupHexGrid)
})

defineExpose({ initMap })
</script>
