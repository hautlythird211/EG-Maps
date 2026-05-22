import { ref, onMounted } from 'vue'
import type { Species } from '@/lib/types'

export function useSpeciesData() {
  const data = ref<Species[]>([])
  const loading = ref(true)
  const error = ref<Error | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/data/species.json')
      if (!res.ok) throw new Error(`Failed to load species data: ${res.status}`)
      data.value = await res.json()
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
