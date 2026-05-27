/**
 * useChunkedDataLoader - Progressive data loading with chunked processing
 * Handles 10,000+ entities with minimal memory footprint and smooth 60fps animations
 */
import { ref, computed, watch } from 'vue'

export interface ChunkedLoaderOptions {
  chunkSize?: number
  maxConcurrentChunks?: number
  processingDelay?: number
  enableWebWorker?: boolean
  onProgress?: (progress: number, loaded: number, total: number) => void
  onChunkLoaded?: (chunkIndex: number, entities: unknown[]) => void
  onComplete?: (allEntities: unknown[]) => void
}

export interface ChunkedLoaderState {
  isLoading: boolean
  progress: number
  loadedCount: number
  totalCount: number
  currentChunk: number
  totalChunks: number
  entities: unknown[]
  errors: Error[]
  isCancelled: boolean
}

export function useChunkedDataLoader<T = unknown>(
  dataProvider: () => Promise<T[]>,
  options: ChunkedLoaderOptions = {}
) {
  const {
    chunkSize = 100,
    maxConcurrentChunks = 2,
    processingDelay = 16,
    onProgress,
    onChunkLoaded,
    onComplete
  } = options

  // State management
  const state = ref<ChunkedLoaderState>({
    isLoading: false,
    progress: 0,
    loadedCount: 0,
    totalCount: 0,
    currentChunk: 0,
    totalChunks: 0,
    entities: [],
    errors: [],
    isCancelled: false
  })

  // Computed properties
  const isLoading = computed(() => state.value.isLoading)
  const progress = computed(() => state.value.progress)
  const entities = computed(() => state.value.entities as T[])
  const hasErrors = computed(() => state.value.errors.length > 0)

  /**
   * Process data in chunks with yielding to main thread
   * This prevents UI freezing and maintains 60fps
   */
  const processInChunks = async (
    data: T[],
    processor: (chunk: T[], index: number) => T[]
  ): Promise<T[]> => {
    const totalChunks = Math.ceil(data.length / chunkSize)
    state.value.totalChunks = totalChunks
    const results: T[] = []

    for (let i = 0; i < totalChunks; i++) {
      if (state.value.isCancelled) break

      const start = i * chunkSize
      const end = Math.min(start + chunkSize, data.length)
      const chunk = data.slice(start, end)

      // Process chunk
      const processedChunk = processor(chunk, i)
      results.push(...processedChunk)

      // Update state
      state.value.currentChunk = i + 1
      state.value.loadedCount = end
      state.value.progress = (end / data.length) * 100

      // Notify progress
      onProgress?.(state.value.progress, end, data.length)
      onChunkLoaded?.(i, processedChunk)

      // Yield to main thread for UI responsiveness
      if (processingDelay > 0 && i < totalChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, processingDelay))
      }
    }

    return results
  }

  /**
   * Load data with chunked processing
   */
  const load = async (): Promise<T[]> => {
    try {
      state.value.isLoading = true
      state.value.isCancelled = false
      state.value.errors = []
      state.value.entities = []

      // Fetch all data
      const rawData = await dataProvider()
      state.value.totalCount = rawData.length

      // Process in chunks
      const processedData = await processInChunks(rawData, (chunk) => chunk as T[])

      state.value.entities = processedData
      onComplete?.(processedData)

      return processedData
    } catch (error) {
      state.value.errors.push(error as Error)
      throw error
    } finally {
      state.value.isLoading = false
    }
  }

  /**
   * Cancel ongoing loading
   */
  const cancel = () => {
    state.value.isCancelled = true
  }

  /**
   * Reset state
   */
  const reset = () => {
    state.value = {
      isLoading: false,
      progress: 0,
      loadedCount: 0,
      totalCount: 0,
      currentChunk: 0,
      totalChunks: 0,
      entities: [],
      errors: [],
      isCancelled: false
    }
  }

  /**
   * Stream data with incremental updates
   * Useful for real-time data sources or API pagination
   */
  const stream = async function* (): AsyncGenerator<T[], void, unknown> {
    try {
      state.value.isLoading = true
      state.value.isCancelled = false

      const rawData = await dataProvider()
      state.value.totalCount = rawData.length

      const totalChunks = Math.ceil(rawData.length / chunkSize)

      for (let i = 0; i < totalChunks; i++) {
        if (state.value.isCancelled) break

        const start = i * chunkSize
        const end = Math.min(start + chunkSize, rawData.length)
        const chunk = rawData.slice(start, end)

        state.value.currentChunk = i + 1
        state.value.loadedCount = end
        state.value.progress = (end / rawData.length) * 100

        yield chunk

        // Small delay between chunks for UI responsiveness
        if (processingDelay > 0 && i < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, processingDelay))
        }
      }
    } finally {
      state.value.isLoading = false
    }
  }

  /**
   * Add entities incrementally (for real-time updates)
   */
  const addEntities = (newEntities: T[]) => {
    state.value.entities = [...state.value.entities, ...newEntities]
    state.value.loadedCount = state.value.entities.length
    state.value.progress = (state.value.loadedCount / state.value.totalCount) * 100
  }

  /**
   * Filter entities efficiently
   */
  const filterEntities = (predicate: (entity: T) => boolean): T[] => {
    return state.value.entities.filter(predicate)
  }

  return {
    state,
    isLoading,
    progress,
    entities,
    hasErrors,
    load,
    cancel,
    reset,
    stream,
    addEntities,
    filterEntities
  }
}
