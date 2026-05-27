/**
 * EG-Maps Type Definitions
 * Comprehensive types for data loading, rendering, and performance optimization
 */

// Entity types
export interface GeoCoordinate {
  lat: number
  lng: number
}

export interface ProjectEntity {
  id: string | number
  name: string
  coordinates: GeoCoordinate
  region?: string
  country?: string
  beneficiaries?: number
  funding?: number
  status?: 'active' | 'completed' | 'planned'
  category?: string
  description?: string
  imageUrl?: string
}

export interface SpeciesEntity {
  id: string | number
  name: string
  scientificName: string
  coordinates: GeoCoordinate
  category?: string
  conservationStatus?: 'EX' | 'EW' | 'CR' | 'EN' | 'VU' | 'NT' | 'LC'
  habitat?: string
  population?: number
  imageUrl?: string
  redBookUrl?: string
}

// Map entity type for unified handling
export interface MapEntity {
  id: string | number
  type: 'project' | 'species'
  name: string
  coordinates: GeoCoordinate
  properties: Record<string, unknown>
}

// Performance types
export interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  renderTime: number
  entityCount: number
  visibleEntities: number
}

export interface LoadState {
  isLoading: boolean
  progress: number
  loadedCount: number
  totalCount: number
  errors: Error[]
  currentPhase: 'fetching' | 'processing' | 'rendering' | 'complete'
}

// Rendering types
export interface MarkerStyle {
  size: number
  color: string
  borderColor: string
  borderWidth: number
  opacity: number
  shadow?: boolean
  animation?: 'pulse' | 'ripple' | 'bounce' | 'none'
}

export interface ClusterStyle {
  minSize: number
  maxSize: number
  colorStops: Array<{ count: number; color: string }>
  borderColor: string
  borderWidth: number
  showCount: boolean
  countFontSize: number
}

// Data loading types
export interface DataLoadConfig {
  chunkSize: number
  processingDelay: number
  maxConcurrent: number
  enableCache: boolean
  cacheDuration: number
  retryAttempts: number
  timeout: number
}

export interface ChunkResult<T> {
  chunkIndex: number
  data: T[]
  totalChunks: number
  progress: number
}

// API types
export interface APIEndpointConfig {
  url: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  transform?: (data: unknown) => unknown
  cacheEnabled: boolean
  cacheDuration: number
}

export interface APIResponse<T> {
  data: T | null
  loading: boolean
  error: Error | null
  cached: boolean
  timestamp: number
}

// Animation types
export interface AnimationConfig {
  duration: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  loop: boolean
  delay: number
}

export interface LoadingAnimationState {
  rotation: number
  pulsePhase: number
  particlePositions: Array<{ x: number; y: number; opacity: number }>
  progress: number
}

// Map view types
export interface ViewState {
  center: [number, number]
  zoom: number
  bearing: number
  pitch: number
}

export interface ViewportBounds {
  north: number
  south: number
  east: number
  west: number
}

// Event types
export interface MapEvent {
  type: 'click' | 'hover' | 'select' | 'cluster-click'
  entityId?: string | number
  coordinates?: GeoCoordinate
  properties?: Record<string, unknown>
}

// Filter types
export interface FilterState {
  searchQuery: string
  categories: string[]
  regions: string[]
  conservationStatuses: string[]
  dateRange?: { start: Date; end: Date }
  showOnlyActive: boolean
}

// Export all types
export type {
  GeoCoordinate,
  ProjectEntity,
  SpeciesEntity,
  MapEntity,
  PerformanceMetrics,
  LoadState,
  MarkerStyle,
  ClusterStyle,
  DataLoadConfig,
  ChunkResult,
  APIEndpointConfig,
  APIResponse,
  AnimationConfig,
  LoadingAnimationState,
  ViewState,
  ViewportBounds,
  MapEvent,
  FilterState
}
