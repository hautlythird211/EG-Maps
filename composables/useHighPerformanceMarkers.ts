/**
 * useHighPerformanceMarkers - GPU-accelerated marker rendering for 10,000+ entities
 * Uses MapLibre native GeoJSON clustering with symbol layers
 */
import maplibregl from 'maplibre-gl'
import type { Map as MapLibreMap } from 'maplibre-gl'

export interface MarkerEntity {
  id: string | number
  coordinates: [number, number]
  properties: Record<string, unknown>
}

export interface HighPerfMarkerOptions {
  map: MapLibreMap
  sourceId: string
  layerId: string
  clusterRadius?: number
  clusterMaxZoom?: number
  clusterProperties?: Record<string, unknown>
  symbolLayout?: Record<string, unknown>
  unclusteredPointRadius?: number
  useNativeGeoJSON?: boolean
  autoSwitchThreshold?: number
}

export interface ClusterProperties {
  cluster: boolean
  cluster_id: number
  point_count: number
  point_count_abbreviated: string
}

export function useHighPerformanceMarkers(options: HighPerfMarkerOptions) {
  const {
    map,
    sourceId,
    layerId,
    clusterRadius = 50,
    clusterMaxZoom = 14,
    clusterProperties = {},
    symbolLayout = {},
    unclusteredPointRadius = 8,
    useNativeGeoJSON = true,
    autoSwitchThreshold = 500
  } = options

  // State
  let markersSource: maplibregl.GeoJSONSource | null = null
  let markersLayer: maplibregl.Layer | null = null
  let clusterLayer: maplibregl.Layer | null = null
  let unclusteredLayer: maplibregl.Layer | null = null
  const markerInstances = new Map<string, maplibregl.Marker>()

  /**
   * Create GeoJSON FeatureCollection from entities
   */
  const createGeoJSON = (entities: MarkerEntity[]): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: entities.map(entity => ({
        type: 'Feature' as const,
        id: entity.id,
        geometry: {
          type: 'Point' as const,
          coordinates: entity.coordinates
        },
        properties: entity.properties
      }))
    }
  }

  /**
   * Initialize GPU-accelerated markers with native GeoJSON clustering
   */
  const initializeGPUMarkers = (entities: MarkerEntity[]) => {
    // Remove existing layers if any
    cleanup()

    const geojsonData = createGeoJSON(entities)
    const useClustering = entities.length > autoSwitchThreshold

    // Add source with clustering
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojsonData,
      cluster: useClustering,
      clusterRadius,
      clusterMaxZoom,
      clusterProperties: {
        // Aggregate functions for cluster properties
        ...clusterProperties
      }
    })

    markersSource = map.getSource(sourceId) as maplibregl.GeoJSONSource

    // Add cluster layer (circles for clusters)
    map.addLayer({
      id: `${layerId}-clusters`,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        // Cluster circle styling
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#22c55e', // green for small clusters
          100,
          '#f59e0b', // yellow for medium
          500,
          '#ef4444' // red for large
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20, // small cluster size
          100,
          25,
          500,
          30
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    })

    clusterLayer = map.getLayer(`${layerId}-clusters`) || null

    // Add cluster count labels
    map.addLayer({
      id: `${layerId}-cluster-count`,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    })

    // Add unclustered point layer
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'category'],
          'project',
          '#10b981',
          'species',
          '#f59e0b',
          '#6366f1' // default indigo
        ],
        'circle-radius': unclusteredPointRadius,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    })

    unclusteredLayer = map.getLayer(layerId) || null

    // Set up click handlers
    setupClickHandlers()
  }

  /**
   * Update marker data (incremental updates)
   */
  const updateMarkers = (entities: MarkerEntity[]) => {
    if (!markersSource) {
      initializeGPUMarkers(entities)
      return
    }

    const geojsonData = createGeoJSON(entities)
    markersSource.setData(geojsonData)
  }

  /**
   * Add single marker
   */
  const addMarker = (entity: MarkerEntity) => {
    if (!markersSource) return

    const features = markersSource._data?.features || []
    const newFeatures = [...features, {
      type: 'Feature' as const,
      id: entity.id,
      geometry: {
        type: 'Point' as const,
        coordinates: entity.coordinates
      },
      properties: entity.properties
    }]

    markersSource.setData({
      type: 'FeatureCollection',
      features: newFeatures
    })
  }

  /**
   * Remove marker by ID
   */
  const removeMarker = (id: string | number) => {
    if (!markersSource) return

    const features = markersSource._data?.features || []
    const filteredFeatures = features.filter(f => f.id !== id)

    markersSource.setData({
      type: 'FeatureCollection',
      features: filteredFeatures
    })
  }

  /**
   * Set up click/tap handlers for markers and clusters
   */
  const setupClickHandlers = () => {
    // Cluster click - zoom in
    map.on('click', `${layerId}-clusters`, (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [`${layerId}-clusters`]
      })

      if (!features.length) return

      const clusterId = features[0].properties?.cluster_id
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return

        map.easeTo({
          center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
          zoom: zoom || map.getZoom() + 2
        })
      })
    })

    // Marker click - show popup
    map.on('click', layerId, (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [layerId]
      })

      if (!features.length) return

      const feature = features[0]
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number]

      // Emit event for popup handling
      map.fire('markerclick', {
        id: feature.id,
        coordinates,
        properties: feature.properties
      })
    })

    // Cursor changes
    map.on('mouseenter', `${layerId}-clusters`, () => {
      map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', `${layerId}-clusters`, () => {
      map.getCanvas().style.cursor = ''
    })

    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = ''
    })
  }

  /**
   * Animate marker scale on hover
   */
  const setMarkerHoverEffect = (enable: boolean) => {
    if (!unclusteredLayer) return

    if (enable) {
      map.setPaintProperty(layerId, 'circle-radius', [
        'case',
        ['==', ['get', 'hover'], true],
        unclusteredPointRadius * 1.5,
        unclusteredPointRadius
      ])
    } else {
      map.setPaintProperty(layerId, 'circle-radius', unclusteredPointRadius)
    }
  }

  /**
   * Filter visible markers
   */
  const filterMarkers = (predicate: (properties: Record<string, unknown>) => boolean) => {
    // MapLibre doesn't support dynamic filtering well
    // For now, just return - filtering is handled at data level
    return
  }

  /**
   * Get current visible markers (within viewport)
   */
  const getVisibleMarkers = (): MarkerEntity[] => {
    const features = map.queryRenderedFeatures({
      layers: [layerId]
    })

    return features.map(f => ({
      id: f.id as string | number,
      coordinates: (f.geometry as GeoJSON.Point).coordinates as [number, number],
      properties: f.properties || {}
    }))
  }

  /**
   * Focus on specific marker
   */
  const focusOnMarker = (id: string | number) => {
    const entities = getVisibleMarkers()
    const entity = entities.find(e => e.id === id)

    if (entity) {
      map.easeTo({
        center: entity.coordinates,
        zoom: Math.max(map.getZoom(), 12)
      })
    }
  }

  /**
   * Cleanup all layers and sources
   */
  const cleanup = () => {
    const layersToRemove = [`${layerId}-clusters`, `${layerId}-cluster-count`, layerId]
    layersToRemove.forEach(l => {
      if (map.getLayer(l)) {
        map.removeLayer(l)
      }
    })

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId)
    }

    markersSource = null
    clusterLayer = null
    unclusteredLayer = null
    markerInstances.clear()
  }

  return {
    initializeGPUMarkers,
    updateMarkers,
    addMarker,
    removeMarker,
    setMarkerHoverEffect,
    filterMarkers,
    getVisibleMarkers,
    focusOnMarker,
    cleanup
  }
}
