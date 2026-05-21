<template>
  <div class="w-full h-screen relative overflow-hidden bg-black" role="main" aria-label="Interactive Map Visualization">
    <!-- Loading skeleton -->
    <Transition name="fade">
      <div v-if="isLoading" class="absolute inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center">
        <div class="relative mb-6">
          <div class="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <div class="absolute inset-0 w-20 h-20 rounded-full border-4 border-purple-500/20 border-b-purple-500 animate-spin" style="animation-delay: 0.5s; animation-direction: reverse" />
        </div>
        <p class="text-cyan-400 font-medium mb-2">{{ t('general.loading') }}</p>
        <p class="text-gray-500 text-sm">{{ t('globe.preparingData', { dataset: activeDataset === 'project-grants' ? t('home.projectGrants').toLowerCase() : t('home.species').toLowerCase() }) }}</p>
        <div class="mt-4 flex gap-1">
          <div class="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style="animation-delay: 0ms" />
          <div class="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style="animation-delay: 150ms" />
          <div class="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style="animation-delay: 300ms" />
        </div>
      </div>
    </Transition>

    <!-- Background effects -->
    <div class="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-green-900/20 pointer-events-none" :style="{ zIndex: 'var(--z-map-effects)' }" />
    <div v-if="!isMobile" class="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-purple-900/20 pointer-events-none" :style="{ zIndex: 'var(--z-map-effects)' }" />

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

    <!-- Vignette -->
    <div class="absolute inset-0 pointer-events-none" :style="{ zIndex: 'var(--z-map-overlays)', boxShadow: 'inset 0 0 150px 20px rgba(0,0,0,0.7)' }" />

    <!-- Hex grid overlay -->
    <canvas v-if="showHexGrid" ref="hexCanvasRef" class="absolute inset-0 w-full h-full pointer-events-none opacity-20" :style="{ zIndex: 'var(--z-map-hex-grid)' }" />

    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none" :style="{ zIndex: 'var(--z-map-effects)' }">
      <div :class="`absolute top-0 left-0 w-full h-full ${isMobile ? 'opacity-5' : 'opacity-10'}`">
        <div class="absolute top-0 left-0 w-1/3 h-1/3 bg-cyan-500/20 blur-3xl animate-pulse-slow" />
        <template v-if="!isMobile">
          <div class="absolute bottom-0 right-0 w-1/3 h-1/3 bg-purple-500/20 blur-3xl animate-pulse-slow-delay" />
          <div class="absolute top-1/2 right-1/4 w-1/4 h-1/4 bg-pink-500/20 blur-3xl animate-pulse-slow-delay-2" />
        </template>
      </div>
    </div>

    <!-- Earth Guardians Banner -->
    <div v-if="isMobile" class="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none px-2" :style="{ zIndex: 'var(--z-map-banner)' }">
      <img src="/white-banner.png" alt="Earth Guardians" class="h-auto w-auto max-h-[12vh] max-w-[240px] object-contain" loading="lazy" />
    </div>
    <div v-else class="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block" :style="{ zIndex: 'var(--z-map-banner)' }">
      <img src="/white-banner.png" alt="Earth Guardians" class="h-auto w-auto max-h-[15vh] max-w-[180px] -rotate-90 origin-center" loading="lazy" />
    </div>

    <!-- Map Container -->
    <div ref="mapContainerRef" class="absolute inset-0 w-full h-full" />

    <!-- Controls - 2D/3D toggle with enhanced styling -->
    <div :class="`absolute ${isMobile ? 'top-[5.35rem] left-3' : 'top-4 left-4'}`" :style="{ zIndex: 'var(--z-map-ui-controls)' }">
      <div class="map-view-switcher panel-cyber rounded-md p-1 flex items-center gap-1">
        <div class="relative">
          <button
            :class="[
              'map-view-tab relative overflow-hidden',
              isMobile ? 'map-view-tab-mobile' : 'map-view-tab-desktop',
              is2DActive ? 'map-view-tab-active' : 'map-view-tab-idle'
            ]"
            aria-current="page"
            @click="setView('2d')"
          >
            <span class="relative z-10 flex items-center gap-2">
              <iconify-icon icon="lucide:map" class="h-4 w-4" />
              {{ t('globe.view2D') }}
            </span>
          </button>
          <div
            v-if="is2DActive"
            class="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 opacity-0 transition-opacity duration-300"
          />
        </div>
        <NuxtLink
          :to="`${datasetBaseRoute}/3d`"
          :class="[
            'map-view-tab map-view-tab-idle',
            isMobile ? 'map-view-tab-mobile' : 'map-view-tab-desktop'
          ]"
          :aria-label="t('globe.switchTo3D')"
        >
          <iconify-icon icon="lucide:globe" class="h-4 w-4" />
          {{ t('globe.view3D') }}
        </NuxtLink>
      </div>
    </div>

    <!-- Global Stats (for project grants only) -->
    <div v-if="activeDataset === 'project-grants'" class="absolute right-0 bottom-24 w-full max-w-xl px-3 sm:bottom-4 sm:px-4 lg:px-0" :style="{ zIndex: 'var(--z-map-global-stats)' }">
      <GlobalStats :projects="visibleProjects" @close="() => {}" />
    </div>

    <!-- Project filter panel -->
    <ProjectFilterPanel
      v-if="activeDataset === 'project-grants' && showFilterPanel"
      :projects="projectsData"
      @filter-change="handleProjectFilterChange"
    />

    <!-- Species filter panel (for endangered species) -->
    <SpeciesFilterPanel
      v-if="activeDataset === 'endangered-species' && showFilterPanel"
      ref="speciesFilterPanelRef"
      :species="speciesData"
      @filter-change="handleFilterChange"
      @group-selection-change="handleSpeciesGroupSelection"
    />

    <!-- Species legend (for endangered species) -->
    <div v-if="activeDataset === 'endangered-species'" class="absolute left-3 bottom-24 sm:left-4 sm:bottom-4" :style="{ zIndex: 'var(--z-map-global-stats)' }">
      <div class="panel-cyber rounded-lg p-3 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
        <h3 class="text-xs font-bold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
          <iconify-icon icon="lucide:layers" class="h-3.5 w-3.5 text-cyan-400" />
          {{ t('globe.taxonomicGroups') }}
        </h3>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="(color, group) in GROUP_COLORS"
            :key="group"
            class="flex items-center gap-1.5 group cursor-pointer rounded px-1 py-0.5 text-left transition-colors hover:bg-cyan-500/10"
            :class="selectedSpeciesGroups.includes(group) ? 'bg-cyan-500/15' : ''"
            @click="toggleLegendGroup(group)"
          >
            <div class="w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover:scale-125" :style="{ backgroundColor: color }" />
            <span class="text-[10px] text-[var(--text-secondary)] group-hover:text-cyan-400 transition-colors">{{ taxonomicGroupLabel(group) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Map Controls -->
    <MapControls
      :is-globe-view="false"
      :show-hex-grid="showHexGrid"
      :show-connections="showConnections"
      :dataset="activeDataset"
      :projects="activeDataset === 'project-grants' ? visibleProjects : undefined"
      :species="activeDataset === 'endangered-species' ? visibleSpecies : undefined"
      :filter-open="showFilterPanel"
      @toggle-hex-grid="showHexGrid = !showHexGrid"
      @toggle-connections="toggleConnections"
      @toggle-filter="showFilterPanel = !showFilterPanel"
      @search-open-change="handleSearchOpenChange"
      @navigate="navigateToLocation"
      :style="{ zIndex: 'var(--z-map-ui-controls)' }"
    />

    <!-- Error state -->
    <Transition name="fade">
      <div v-if="hasError" class="absolute inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center text-white z-[var(--z-map-error-overlay)]">
        <div class="relative mb-6">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-orange-600 animate-pulse" />
          <iconify-icon icon="lucide:alert-triangle" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-white" />
        </div>
        <h2 class="text-xl font-bold mb-2">{{ t('globe.unableToLoad') }}</h2>
        <p class="text-gray-400 mb-4 text-center px-4 max-w-md">{{ t('globe.connectionError') }}</p>
        <button @click="() => { hasError = false; initMap() }" class="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center gap-2">
          <iconify-icon icon="lucide:refresh-cw" class="h-4 w-4" />
          {{ t('globe.tryAgain') }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import maplibregl from 'maplibre-gl'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useI18n } from '@/composables/useI18n'
import { allProjectsData } from '@/lib/project-data'
import type { ProjectData } from '@/lib/types'
import { getProjectColorByBeneficiaries } from '@/lib/colors'
import type { Species } from '@/lib/map-utils'
import { buildProjectPopupHTML, buildSpeciesPopupHTML, isValidCoordinate, GROUP_COLORS } from '@/lib/map-utils'
import {
  buildMapConnectionFeatures,
  createMapParticleSystem,
  syncMapConnectionLayers,
  type MapConnectionFeature,
  type MapParticleSystem,
} from '@/lib/map-effects'

const { t, locale } = useI18n()

const MAPTILER_API_KEY = useRuntimeConfig().public.maptilerApiKey || ''

const MAP_STYLE = MAPTILER_API_KEY
  ? `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`
  : 'https://demotiles.maplibre.org/style.json'

const tileCache = new Map<string, Response>()

function transformRequest(url: string, resourceType?: string) {
  if (resourceType === 'Tile' && tileCache.has(url)) {
    return { url }
  }
  return { url }
}

interface Props {
  projects?: ProjectData[]
  species?: Species[]
  defaultDataset?: 'project-grants' | 'endangered-species'
}

const props = withDefaults(defineProps<Props>(), {
  defaultDataset: 'project-grants',
})
const projectsData = computed(() => props.projects || allProjectsData)
const speciesData = computed(() => props.species || [])
const filteredProjectsList = ref<ProjectData[] | null>(null)
const filteredSpeciesList = ref<Species[] | null>(null)
const visibleProjects = computed(() => filteredProjectsList.value ?? projectsData.value)
const visibleSpecies = computed(() => filteredSpeciesList.value ?? speciesData.value)

// Base route for dataset navigation (without /3d suffix)
const datasetBaseRoute = computed(() => {
  return activeDataset.value === 'project-grants' ? '/project-grants' : '/endangered-species'
})

const isMobile = useMediaQuery('(max-width: 768px)')
const mapContainerRef = ref<HTMLDivElement | null>(null)
const hexCanvasRef = ref<HTMLCanvasElement | null>(null)
const speciesFilterPanelRef = ref<{ toggleTaxonomicGroup: (group: string) => void } | null>(null)
const selectedSpeciesGroups = ref<string[]>([])
const showHexGrid = ref(true)
const showConnections = ref(true)
const showFilterPanel = ref(false)
const activeDataset = ref<'project-grants' | 'endangered-species'>(props.defaultDataset)
const hasError = ref(false)
const isLoading = ref(true)
const is2DActive = ref(true)

let map: maplibregl.Map | null = null
let markers: maplibregl.Marker[] = []
let pendingVisibilityUpdate = false
let connectionFeatures: MapConnectionFeature[] = []
let particleSystem: MapParticleSystem | null = null

function taxonomicGroupLabel(group: string) {
  return t(`taxonomy.${group}`)
}

function getTaxonomicGroupLabels() {
  return Object.keys(GROUP_COLORS).reduce<Record<string, string>>((labels, group) => {
    labels[group] = taxonomicGroupLabel(group)
    return labels
  }, {})
}

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

function toggleLegendGroup(group: string | number) {
  speciesFilterPanelRef.value?.toggleTaxonomicGroup(String(group))
}

function handleSpeciesGroupSelection(groups: string[]) {
  selectedSpeciesGroups.value = groups
}

function createPopup(maxWidth: string) {
  const popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    focusAfterOpen: false,
    maxWidth: 'none', // We'll handle sizing dynamically
    offset: 14,
    className: 'cyberpunk-popup'
  })

  popup.on('open', () => {
    requestAnimationFrame(() => {
      keepPopupFullyVisible(popup)
      fitPopupToScreen(popup)
    })
  })

  return popup
}

// Dynamically adjust popup size and position to show fully on screen
function fitPopupToScreen(popup: maplibregl.Popup) {
  const popupEl = popup.getElement()
  if (!popupEl) return

  // Set ultra-high z-index to be on top of everything
  popupEl.style.zIndex = '2147483647'
  
  const content = popupEl.querySelector('.maplibregl-popup-content') as HTMLElement
  if (!content) return

  const margin = 16
  const maxWidth = window.innerWidth - margin * 2
  const maxHeight = window.innerHeight - margin * 2

  // Set max dimensions
  content.style.maxWidth = `${maxWidth}px`
  content.style.maxHeight = `${maxHeight}px`
  content.style.overflow = 'auto'
  
  // Get actual dimensions after setting max
  requestAnimationFrame(() => {
    const rect = content.getBoundingClientRect()
    
    // Calculate if popup needs to be repositioned to top of screen
    let topOffset = -rect.top + margin
    let leftOffset = -rect.left + margin
    
    // If popup goes off right edge
    if (rect.right > window.innerWidth - margin) {
      leftOffset = window.innerWidth - rect.width - margin
    }
    
    // If popup goes off left edge
    if (rect.left < margin) {
      leftOffset = margin - rect.left
    }
    
    // If popup is taller than screen, position at top and allow scrolling
    if (rect.height > maxHeight) {
      topOffset = margin - rect.top
      content.style.maxHeight = `${maxHeight}px`
      content.style.overflowY = 'auto'
    }
    
    // Apply positioning
    if (topOffset !== 0 || leftOffset !== 0) {
      const offsetElement = popupEl.querySelector('.maplibregl-popup-tip') as HTMLElement
      // The popup positioning is handled by MapLibre, but we can adjust content
    }
  })
}

function keepPopupFullyVisible(popup: maplibregl.Popup) {
  if (!map) return

  const popupEl = popup.getElement()
  if (!popupEl) return

  popupEl.style.zIndex = '2147483000'

  const fit = () => {
    const rect = popupEl.getBoundingClientRect()
    const margin = 12
    let panX = 0
    let panY = 0

    if (rect.left < margin) panX = rect.left - margin
    else if (rect.right > window.innerWidth - margin) panX = rect.right - window.innerWidth + margin

    if (rect.top < margin) panY = rect.top - margin
    else if (rect.bottom > window.innerHeight - margin) panY = rect.bottom - window.innerHeight + margin

    if (panX || panY) {
      map?.panBy([panX, panY], { duration: 220 })
    }
  }

  fit()
  window.setTimeout(fit, 260)
}

function setView(view: '2d' | '3d') {
  is2DActive.value = view === '2d'
}

function handleFilterChange(filtered: Species[]) {
  filteredSpeciesList.value = filtered
  rebuildMarkers()
  addConnections()
  if (showConnections.value) startParticles()
}

function handleProjectFilterChange(filtered: ProjectData[]) {
  filteredProjectsList.value = filtered
  rebuildMarkers()
  addConnections()
  if (showConnections.value) startParticles()
}

function handleSearchOpenChange(open: boolean) {
  if (open && isMobile.value) {
    showFilterPanel.value = false
  }
}

function toggleConnections() {
  showConnections.value = !showConnections.value
}

function getUnifiedMarkerMetrics(options: {
  color: string
  size: number
  centerScale?: number
  imageUrl?: string
}) {
  const hitSize = Math.max(34, Math.round(options.size + 12))
  const visualSize = Math.round(options.size)

  return {
    hitSize,
    visualSize,
    color: options.color,
    centerSize: Math.max(7, Math.round(visualSize * (options.centerScale ?? 0.42))),
    imageUrl: options.imageUrl,
  }
}

function createUnifiedMarkerElement(metrics: ReturnType<typeof getUnifiedMarkerMetrics>) {
  const el = document.createElement('div')
  el.style.width = `${metrics.hitSize}px`
  el.style.height = `${metrics.hitSize}px`
  el.style.display = 'flex'
  el.style.justifyContent = 'center'
  el.style.alignItems = 'center'
  el.style.cursor = 'pointer'
  el.style.pointerEvents = 'auto'
  el.style.zIndex = '10'
  // Ensure marker stays within map container
  el.style.position = 'relative'

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
  inner.style.transition = 'transform 160ms ease, box-shadow 160ms ease, width 160ms ease, height 160ms ease'
  // Use transform-origin center and avoid translateZ which causes positioning issues
  inner.style.transformOrigin = 'center center'
  inner.style.transform = 'scale(1)'

  if (metrics.imageUrl) {
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
  const totalBeneficiaries = project.direct_beneficiaries + project.indirect_beneficiaries
  const beneficiaryFactor = Math.min(Math.max(totalBeneficiaries / 10000, 0.5), 5)
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
    imageUrl: species.imageUrl,
  }))
}

function rebuildMarkers() {
  if (!map) return

  // Clear existing markers
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
    visibleProjects.value.forEach((project) => {
      if (!isValidCoordinate(project.latitude, project.longitude)) return

      const el = createProjectMarkerElement(project)
      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        focusAfterOpen: false,
        maxWidth: 'min(420px, calc(100vw - 24px))',
        offset: 14,
        className: 'cyberpunk-popup'
      }).setHTML(buildProjectPopupHTML(project, projectPopupTranslations))

      popup.on('open', () => {
        requestAnimationFrame(() => keepPopupFullyVisible(popup))
      })

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([project.longitude, project.latitude])
        .setPopup(popup)
        .addTo(map!)

      markers.push(marker)
    })
  } else if (activeDataset.value === 'endangered-species') {
    visibleSpecies.value.forEach((species) => {
      if (!isValidCoordinate(species.lat, species.lng)) return

      const el = createSpeciesMarkerElement(species)
      const localizedSpecies = getLocalizedSpecies(species)

      const popup = createPopup('min(560px, calc(100vw - 24px))')
        .setHTML(buildSpeciesPopupHTML(localizedSpecies, speciesPopupTranslations))

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([species.lng, species.lat])
        .setPopup(popup)
        .addTo(map!)

      markers.push(marker)
    })
  }

  updateMarkerVisibility()
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
    projects: visibleProjects.value,
    species: visibleSpecies.value,
    isMobile: isMobile.value,
  })

  syncMapConnectionLayers(map, connectionFeatures)
}

function cleanupParticles() {
  particleSystem?.stop()
  particleSystem = null
}

function startParticles() {
  if (!showConnections.value || !map || !mapContainerRef.value || !connectionFeatures.length) return

  cleanupParticles()

  particleSystem = createMapParticleSystem({
    map,
    container: mapContainerRef.value,
    getFeatures: () => connectionFeatures,
    isMobile: () => isMobile.value,
    zIndex: 2,
  })
  particleSystem.start()
}

function navigateToLocation(lat: number, lng: number) {
  if (map) {
    map.flyTo({ center: [lng, lat], zoom: 6, duration: 1500, essential: true })
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
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const hexSize = isMobile.value ? 35 : 50
  const hexHeight = hexSize * Math.sqrt(3)
  const hexWidth = hexSize * 2
  const hexVerticalOffset = hexHeight * 0.75
  const hexHorizontalOffset = hexWidth * 0.5
  const columns = Math.ceil(window.innerWidth / hexHorizontalOffset) + 1
  const rows = Math.ceil(window.innerHeight / hexVerticalOffset) + 1

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)'
  ctx.lineWidth = 1.5

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
  }, 150)
}

function initMap() {
  if (!mapContainerRef.value) return

  // Clean up existing map if retry
  if (map) {
    markers.forEach(m => m.remove())
    markers = []
    map.remove()
    map = null
  }

  isLoading.value = true

  try {
    map = new maplibregl.Map({
      container: mapContainerRef.value,
      style: MAP_STYLE,
      zoom: isMobile.value ? 1.8 : 3,
      center: [0, 0],
      attributionControl: false,
      renderWorldCopies: true,
      minZoom: isMobile.value ? 0.5 : 1.5,
      maxZoom: isMobile.value ? 8 : 9,
      fadeDuration: 100,
      maxTileCacheSize: 200,
      maxTileCacheZoomLevels: 5,
      transformRequest,
    })

    map.addControl(
      new maplibregl.AttributionControl({
        customAttribution: `EARTH GUARDIANS @ ${new Date().getFullYear()}`
      })
    )

    if (!isMobile.value) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-left')
    }

    map.on('load', () => {
      isLoading.value = false
      rebuildMarkers()
      addConnections()
      startParticles()
      setupHexGrid()
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

    map.on('resize', () => {
      debouncedSetupHexGrid()
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
      if (!map?.loaded()) {
        isLoading.value = false
        hasError.value = true
      }
    })

    // Timeout fallback for loading
    setTimeout(() => {
      if (isLoading.value) {
        isLoading.value = false
      }
    }, 10000)

    window.addEventListener('resize', debouncedSetupHexGrid)
  } catch (err) {
    console.error('Failed to initialize map:', err)
    isLoading.value = false
    hasError.value = true
  }
}

onMounted(() => {
  showFilterPanel.value = !isMobile.value
  initMap()
})

watch(isMobile, (mobile) => {
  showFilterPanel.value = !mobile
})

watch(locale, () => {
  rebuildMarkers()
})

watch(showHexGrid, async (visible) => {
  if (!visible) return
  await nextTick()
  setupHexGrid()
})

watch(showConnections, () => {
  addConnections()
  if (showConnections.value) startParticles()
})

onUnmounted(() => {
  if (hexGridDebounceTimer) clearTimeout(hexGridDebounceTimer)
  cleanupParticles()
  markers.forEach(m => m.remove())
  markers = []
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.maplibregl-popup-content {
  background: rgba(0, 0, 0, 0.95) !important;
  border-radius: 8px !important;
  border: 1px solid rgba(6, 182, 212, 0.4) !important;
  box-shadow: 0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 15px rgba(6, 182, 212, 0.05) !important;
  padding: 0 !important;
  min-width: 260px;
  max-width: calc(100vw - 32px) !important;
  max-height: calc(100vh - 32px) !important;
  overflow: visible !important;
  overflow-y: auto !important;
  word-wrap: break-word !important;
  white-space: normal !important;
}

.maplibregl-popup.cyberpunk-popup {
  z-index: 2147483647 !important;
  pointer-events: auto !important;
}

.maplibregl-popup.cyberpunk-popup .maplibregl-popup-content {
  width: auto !important;
  min-width: 280px !important;
  max-width: min(560px, calc(100vw - 32px)) !important;
  max-height: calc(100vh - 60px) !important;
  overflow-y: auto !important;
}

.maplibregl-popup-anchor-top .maplibregl-popup-tip {
  bottom: -10px !important;
}

.maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
  top: -10px !important;
}

.maplibregl-marker {
  pointer-events: auto;
  z-index: 10;
}

.maplibregl-popup-tip {
  border-top-color: rgba(6, 182, 212, 0.8) !important;
  border-bottom-color: rgba(6, 182, 212, 0.8) !important;
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
  margin-bottom: 8px;
  margin-right: 8px;
}

.maplibregl-ctrl-attrib-inner {
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
}
</style> 0, 0, 0.6) !important;
  padding: 2px 6px;
  border-radius: 4px;
}

.maplibregl-ctrl-attrib-inner a {
  color: rgba(6, 182, 212, 0.8);
  text-decoration: none;
  transition: color 0.2s ease;
}

.maplibregl-ctrl-attrib-inner a:hover {
  color: rgba(6, 182, 212, 1);
}

.maplibregl-map {
  background-color: transparent !important;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.1; }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

.bg-gradient-radial {
  background: radial-gradient(ellipse at center, var(--tw-gradient-stops));
}

/* Project Popup Styles */
.project-popup-wrapper {
  padding: 16px;
  min-width: 240px;
  width: min(420px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
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
  overflow-wrap: anywhere;
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
  width: min(560px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  overflow: visible;
}
.species-image-frame {
  height: 180px;
  overflow: hidden;
  border-bottom: 1px solid;
  background: rgba(0, 0, 0, 0.6);
}
.species-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  overflow-wrap: anywhere;
}
.species-scientific-name {
  font-size: 12px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  position: relative;
  z-index: 1;
  overflow-wrap: anywhere;
}
.species-body {
  padding: 14px 16px;
}
.species-description {
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 14px 0;
  max-height: none;
  overflow: visible;
  overflow-wrap: anywhere;
  word-break: normal;
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
  min-width: 0;
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
  overflow-wrap: anywhere;
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

@media (max-width: 640px) {
  .project-popup-wrapper,
  .species-popup-wrapper {
    width: calc(100vw - 24px);
  }

  .species-image-frame {
    height: 138px;
  }
}
</style>
