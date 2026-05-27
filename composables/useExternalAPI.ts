/**
 * useExternalAPI - External API loader for SSG/GitHub Pages compatibility
 * Supports chunked loading, caching, and offline fallback
 */
import { ref, computed } from 'vue'

export interface APIEndpoint {
  url: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  transform?: (data: unknown) => unknown
  cacheDuration?: number
}

export interface APILoaderOptions {
  baseURL?: string
  endpoints?: Record<string, APIEndpoint>
  useCache?: boolean
  cacheStorage?: 'localStorage' | 'sessionStorage' | 'memory'
  retryAttempts?: number
  retryDelay?: number
  timeout?: number
  onProgress?: (progress: number) => void
  onError?: (error: Error) => void
}

export interface APIResponse<T = unknown> {
  data: T | null
  loading: boolean
  error: Error | null
  cached: boolean
  timestamp: number
}

export function useExternalAPI<T = unknown>(options: APILoaderOptions = {}) {
  const {
    baseURL = '',
    endpoints = {},
    useCache = true,
    cacheStorage = 'sessionStorage',
    retryAttempts = 3,
    retryDelay = 1000,
    timeout = 30000,
    onProgress,
    onError
  } = options

  // Cache storage
  const memoryCache = new Map<string, { data: unknown; timestamp: number }>()

  /**
   * Get from cache
   */
  const getFromCache = (key: string): unknown | null => {
    if (!useCache) return null

    // Check memory cache first
    const memoryItem = memoryCache.get(key)
    if (memoryItem) return memoryItem.data

    // Check storage cache
    try {
      const storageKey = `api_cache_${key}`
      if (cacheStorage === 'sessionStorage') {
        const sessionData = sessionStorage.getItem(storageKey)
        if (sessionData) {
          const parsed = JSON.parse(sessionData)
          return parsed.data
        }
      } else if (cacheStorage === 'localStorage') {
        const localData = localStorage.getItem(storageKey)
        if (localData) {
          const parsed = JSON.parse(localData)
          return parsed.data
        }
      }
    } catch {
      // Cache read failed, continue without cache
    }

    return null
  }

  /**
   * Save to cache
   */
  const saveToCache = (key: string, data: unknown) => {
    if (!useCache) return

    const cacheItem = { data, timestamp: Date.now() }

    // Save to memory
    memoryCache.set(key, cacheItem)

    // Save to storage
    try {
      const storageKey = `api_cache_${key}`
      const serialized = JSON.stringify(cacheItem)

      if (cacheStorage === 'sessionStorage') {
        sessionStorage.setItem(storageKey, serialized)
      } else if (cacheStorage === 'localStorage') {
        localStorage.setItem(storageKey, serialized)
      }
    } catch {
      // Cache write failed, continue without caching
    }
  }

  /**
   * Check cache freshness
   */
  const isCacheValid = (key: string, duration: number): boolean => {
    try {
      const storageKey = `api_cache_${key}`
      let timestamp = 0

      if (cacheStorage === 'sessionStorage') {
        const data = sessionStorage.getItem(storageKey)
        if (data) timestamp = JSON.parse(data).timestamp
      } else if (cacheStorage === 'localStorage') {
        const data = localStorage.getItem(storageKey)
        if (data) timestamp = JSON.parse(data).timestamp
      }

      return Date.now() - timestamp < duration
    } catch {
      return false
    }
  }

  /**
   * Fetch with retry logic
   */
  const fetchWithRetry = async (
    url: string,
    attempt = 1
  ): Promise<Response> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      if (attempt < retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        return fetchWithRetry(url, attempt + 1)
      }
      throw error
    }
  }

  /**
   * Load data from endpoint
   */
  const loadEndpoint = async (
    endpointKey: string,
    params?: Record<string, string>
  ): Promise<T> => {
    const endpoint = endpoints[endpointKey]
    if (!endpoint) {
      throw new Error(`Endpoint "${endpointKey}" not found`)
    }

    // Build URL with params
    let url = endpoint.url
    if (baseURL && !url.startsWith('http')) {
      url = `${baseURL}${url}`
    }

    if (params) {
      const queryString = new URLSearchParams(params).toString()
      url = `${url}?${queryString}`
    }

    // Check cache first
    const cacheKey = `${endpointKey}_${JSON.stringify(params || {})}`
    if (endpoint.cacheDuration && isCacheValid(cacheKey, endpoint.cacheDuration)) {
      const cachedData = getFromCache(cacheKey)
      if (cachedData) {
        return cachedData as T
      }
    }

    // Fetch data
    try {
      onProgress?.(0)

      const response = await fetchWithRetry(url)
      const rawData = await response.json()

      onProgress?.(100)

      // Transform data if needed
      const data = endpoint.transform
        ? endpoint.transform(rawData) as T
        : rawData as T

      // Save to cache
      if (endpoint.cacheDuration) {
        saveToCache(cacheKey, data)
      }

      return data
    } catch (error) {
      onError?.(error as Error)
      throw error
    }
  }

  /**
   * Load multiple endpoints sequentially
   */
  const loadMultiple = async (
    endpointKeys: string[],
    onEachProgress?: (key: string, progress: number) => void
  ): Promise<Record<string, T>> => {
    const results: Record<string, T> = {}

    for (let i = 0; i < endpointKeys.length; i++) {
      const key = endpointKeys[i]
      
      try {
        const data = await loadEndpoint(key)
        results[key] = data
        onEachProgress?.(key, 100)
      } catch (error) {
        console.error(`Failed to load endpoint "${key}":`, error)
        // Continue with other endpoints
      }
    }

    return results
  }

  /**
   * Load multiple endpoints in parallel
   */
  const loadParallel = async (
    endpointKeys: string[]
  ): Promise<Record<string, T>> => {
    const promises = endpointKeys.map(async (key) => {
      try {
        const data = await loadEndpoint(key)
        return { key, data, success: true }
      } catch (error) {
        console.error(`Failed to load endpoint "${key}":`, error)
        return { key, data: null, success: false, error }
      }
    })

    const results = await Promise.all(promises)

    return results.reduce((acc, result) => {
      if (result.success && result.data) {
        acc[result.key] = result.data
      }
      return acc
    }, {} as Record<string, T>)
  }

  /**
   * Stream data with chunked loading
   */
  const streamData = async function* (
    endpointKey: string,
    chunkSize = 100
  ): AsyncGenerator<T[], void, unknown> {
    const data = await loadEndpoint(endpointKey)

    if (!Array.isArray(data)) {
      throw new Error('Stream data must be an array')
    }

    const totalChunks = Math.ceil(data.length / chunkSize)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, data.length)
      const chunk = data.slice(start, end) as T[]

      onProgress?.(((i + 1) / totalChunks) * 100)
      yield chunk

      // Small delay for UI responsiveness
      await new Promise(resolve => setTimeout(resolve, 16))
    }
  }

  /**
   * Clear all caches
   */
  const clearCache = () => {
    memoryCache.clear()

    if (cacheStorage === 'sessionStorage') {
      sessionStorage.clear()
    } else if (cacheStorage === 'localStorage') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('api_cache_'))
      keys.forEach(k => localStorage.removeItem(k))
    }
  }

  /**
   * Check if endpoint is cached
   */
  const isEndpointCached = (endpointKey: string, params?: Record<string, string>): boolean => {
    const cacheKey = `${endpointKey}_${JSON.stringify(params || {})}`
    return memoryCache.has(cacheKey)
  }

  return {
    loadEndpoint,
    loadMultiple,
    loadParallel,
    streamData,
    clearCache,
    isEndpointCached,
    getFromCache,
    saveToCache
  }
}
