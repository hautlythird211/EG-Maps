import { ref, onMounted, watch } from 'vue'
import type { Species } from '@/lib/types'

const cache = new Map<string, Species[]>()

export function useSpeciesData(dataset?: string) {
  const data = ref<Species[]>([])
  const loading = ref(true)
  const error = ref<Error | null>(null)

  const effectiveDataset = dataset || 'icmbio-brazil'

  async function load() {
    if (cache.has(effectiveDataset)) {
      data.value = cache.get(effectiveDataset)!
      loading.value = false
      return
    }

    loading.value = true
    error.value = null
    try {
      const res = await fetch(`/data/species/${effectiveDataset}.json`)
      if (!res.ok) throw new Error(`Failed to load species data: ${res.status}`)
      data.value = await res.json()
      cache.set(effectiveDataset, data.value)
    } catch (e) {
      error.value = e as Error
      console.error('Failed to load species data:', e)
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { data, loading, error, reload: load }
}

export function getSpeciesCache() {
  return cache
}
