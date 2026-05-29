import { ref, computed } from 'vue'
import { useOfflineTiles } from './useOfflineTiles'

export interface DownloadItem {
  id: string
  label: string
  size: string
  progress: number
  total: number
  done: boolean
  error: boolean
}

export type DownloadState = 'idle' | 'checking' | 'downloading' | 'completed' | 'error'

const STORAGE_KEY = 'eg-maps-offline-downloaded'

const state = ref<DownloadState>('idle')
const overallProgress = ref(0)
const items = ref<DownloadItem[]>([])
const cacheSize = ref('')
let abortController: AbortController | null = null

function loadPersistedState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch { return false }
}

function savePersistedState(val: boolean) {
  try { localStorage.setItem(STORAGE_KEY, String(val)) } catch { }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function estimateTileCount(minZoom: number, maxZoom: number): number {
  let total = 0
  for (let z = minZoom; z <= maxZoom; z++) {
    total += Math.pow(4, z)
  }
  return total
}

export function useOfflineDownload() {
  const apiKey = (typeof useRuntimeConfig !== 'undefined')
    ? useRuntimeConfig().public.maptilerApiKey
    : ''
  const baseURL = (typeof useRuntimeConfig !== 'undefined')
    ? (useRuntimeConfig().app?.baseURL as string) || '/'
    : '/'

  const offlineTiles = useOfflineTiles(apiKey)
  let hasInitialized = false

  const isCompleted = computed(() => state.value === 'completed')
  const isDownloading = computed(() => state.value === 'downloading' || state.value === 'checking')
  const canStart = computed(() => state.value === 'idle' || state.value === 'error')
  const elapsed = ref(0)

  const TILE_TOTAL = estimateTileCount(0, 5)

  const DATA_FILES: { id: string; label: string; size: string }[] = [
    { id: 'species-index', label: 'Species Index', size: '3.2 MB' },
    { id: 'iucn', label: 'IUCN Red List', size: '1.6 MB' },
    { id: 'icon-mapping', label: 'Species Icons', size: '872 KB' },
    { id: 'species-full', label: 'Species Full Data', size: '35 MB' },
  ]

  const LOCALE_COUNT = 8

  function buildItems(): DownloadItem[] {
    return [
      {
        id: 'tiles',
        label: 'Map Tiles (zoom 0-5)',
        size: formatBytes(TILE_TOTAL * 25000),
        progress: 0,
        total: TILE_TOTAL,
        done: false,
        error: false,
      },
      ...DATA_FILES.map(f => ({
        id: f.id,
        label: f.label,
        size: f.size,
        progress: 0,
        total: 1,
        done: false,
        error: false,
      })),
      {
        id: 'locales',
        label: 'Translations (8 languages)',
        size: '24 KB',
        progress: 0,
        total: LOCALE_COUNT,
        done: false,
        error: false,
      },
    ]
  }

  async function checkCached() {
    state.value = 'checking'
    items.value = buildItems()

    await offlineTiles.init()
    const tileStats = await offlineTiles.getStats()
    cacheSize.value = tileStats.cacheSizeFormatted
    items.value[0].progress = Math.min(tileStats.cachedTiles, TILE_TOTAL)
    items.value[0].done = tileStats.cachedTiles >= TILE_TOTAL

    const dataCache = await caches.open('eg-maps-data-v1')
    const dataUrls: { id: string; url: string }[] = [
      { id: 'species-index', url: `${baseURL}data/species/icmbio-brazil-index.json` },
      { id: 'iucn', url: `${baseURL}data/species/iucn.json` },
      { id: 'icon-mapping', url: `${baseURL}data/species/species-icon-mapping.json` },
      { id: 'species-full', url: `${baseURL}data/species/icmbio-brazil.json` },
    ]

    for (const entry of dataUrls) {
      const cached = await dataCache.match(entry.url)
      const idx = items.value.findIndex(i => i.id === entry.id)
      if (idx >= 0) {
        items.value[idx].done = !!cached
        items.value[idx].progress = cached ? 1 : 0
        if (cached) {
          const headResp = await fetch(entry.url, { method: 'HEAD' }).catch(() => null)
          if (headResp?.ok) {
            const len = headResp.headers.get('content-length')
            if (len) {
              const size = formatBytes(parseInt(len))
              items.value[idx].size = size
            }
          }
        }
      }
    }

    const localesIdx = items.value.findIndex(i => i.id === 'locales')
    if (localesIdx >= 0) {
      const locales = ['en', 'es', 'fr', 'pt', 'ar', 'hi', 'ja', 'zh']
      let cachedCount = 0
      for (const loc of locales) {
        const cached = await dataCache.match(`${baseURL}locales/${loc}.json`)
        if (cached) cachedCount++
      }
      items.value[localesIdx].progress = cachedCount
      items.value[localesIdx].done = cachedCount >= LOCALE_COUNT
    }

    recalcOverall()

    if (items.value.every(i => i.done)) {
      state.value = 'completed'
      savePersistedState(true)
    } else {
      state.value = 'idle'
    }
  }

  function recalcOverall() {
    if (items.value.length === 0) return
    const total = items.value.reduce((s, i) => s + i.total, 0)
    const done = items.value.reduce((s, i) => s + i.progress, 0)
    overallProgress.value = total > 0 ? Math.round((done / total) * 100) : 0
  }

  async function startDownload() {
    if (state.value === 'downloading') return
    abortController = new AbortController()
    state.value = 'downloading'
    const started = Date.now()
    elapsed.value = 0

    if (items.value.length === 0) {
      items.value = buildItems()
    }

    const elapsedTimer = setInterval(() => {
      if (state.value === 'downloading') {
        elapsed.value = Math.floor((Date.now() - started) / 1000)
      }
    }, 1000)

    try {
      await downloadTiles()
      if (abortController.signal.aborted) { clearInterval(elapsedTimer); return }
      await downloadDataFiles()
      if (abortController.signal.aborted) { clearInterval(elapsedTimer); return }
      await downloadLocales()
      recalcOverall()

      if (!abortController.signal.aborted) {
        const stats = await offlineTiles.getStats()
        cacheSize.value = stats.cacheSizeFormatted
        state.value = 'completed'
        savePersistedState(true)
      }
    } catch {
      if (!abortController.signal.aborted) {
        state.value = 'error'
      }
    } finally {
      clearInterval(elapsedTimer)
    }
  }

  async function downloadTiles() {
    const itemIdx = items.value.findIndex(i => i.id === 'tiles')
    const bounds = { north: 85, south: -85, east: 180, west: -180 }

    await offlineTiles.prefetchRegion(bounds, 0, 5, abortController!.signal)

    const stats = await offlineTiles.getStats()
    if (itemIdx >= 0) {
      items.value[itemIdx].progress = Math.min(stats.cachedTiles, TILE_TOTAL)
      items.value[itemIdx].done = stats.cachedTiles >= TILE_TOTAL
    }
    cacheSize.value = stats.cacheSizeFormatted
    recalcOverall()
  }

  async function downloadDataFiles() {
    const cache = await caches.open('eg-maps-data-v1')
    const files: { id: string; path: string }[] = [
      { id: 'species-index', path: `data/species/icmbio-brazil-index.json` },
      { id: 'iucn', path: `data/species/iucn.json` },
      { id: 'icon-mapping', path: `data/species/species-icon-mapping.json` },
      { id: 'species-full', path: `data/species/icmbio-brazil.json` },
    ]

    for (const file of files) {
      if (abortController!.signal.aborted) return
      const idx = items.value.findIndex(i => i.id === file.id)
      if (idx < 0) continue
      try {
        const url = `${baseURL}${file.path}`
        const resp = await fetch(url, { signal: abortController!.signal })
        if (resp.ok) {
          await cache.put(url, resp)
          items.value[idx].progress = 1
          items.value[idx].done = true
        }
      } catch {
        items.value[idx].error = true
      }
      recalcOverall()
    }
  }

  async function downloadLocales() {
    const cache = await caches.open('eg-maps-data-v1')
    const locales = ['en', 'es', 'fr', 'pt', 'ar', 'hi', 'ja', 'zh']
    const idx = items.value.findIndex(i => i.id === 'locales')
    if (idx < 0) return
    let done = 0

    for (const loc of locales) {
      if (abortController!.signal.aborted) return
      try {
        const url = `${baseURL}locales/${loc}.json`
        const resp = await fetch(url, { signal: abortController!.signal })
        if (resp.ok) {
          await cache.put(url, resp)
          done++
        }
      } catch { }
      items.value[idx].progress = done
      recalcOverall()
    }
    items.value[idx].done = done >= LOCALE_COUNT
  }

  function cancel() {
    abortController?.abort()
    state.value = 'idle'
    recalcOverall()
  }

  function reset() {
    state.value = 'idle'
    overallProgress.value = 0
    items.value = []
    cacheSize.value = ''
    hasInitialized = false
    savePersistedState(false)
  }

  async function init() {
    if (hasInitialized && state.value === 'completed') return
    if (loadPersistedState()) {
      state.value = 'completed'
      await offlineTiles.init()
      const stats = await offlineTiles.getStats()
      cacheSize.value = stats.cacheSizeFormatted
      items.value = buildItems()
      await checkCached()
      hasInitialized = true
      return
    }
    await checkCached()
    hasInitialized = true
  }

  return {
    state,
    overallProgress,
    items,
    cacheSize,
    elapsed,
    isCompleted,
    isDownloading,
    canStart,
    init,
    startDownload,
    cancel,
    reset,
    checkCached,
  }
}
