'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { Location, Route } from '@/lib/types'

type MapLayer = 'standard' | 'satellite'

type MockLocation = {
  name: string
  lat: number
  lng: number
  comfort: number
}

export interface LeafletMapProps {
  mapCenter: [number, number]
  mapZoom: number
  mapLayer: MapLayer
  selectionModeRef: React.MutableRefObject<'start' | 'end' | null>
  containerRef?: React.MutableRefObject<HTMLDivElement | null>
  mockLocations: MockLocation[]
  startPoint: Location | null
  endPoint: Location | null
  selectedLocation: string | null
  onLocationClick: (location: MockLocation) => void
  onSelect: (lat: number, lng: number) => void
  routes: Route[]                     
  selectedRouteId: string | null     
  onRouteSelect: (routeId: string) => void 
}

export default function LeafletMap({
  mapCenter,
  mapZoom,
  mapLayer,
  selectionModeRef,
  containerRef: containerRefProp,
  mockLocations,
  startPoint,
  endPoint,
  selectedLocation,
  onLocationClick,
  onSelect,
  routes,              
  selectedRouteId,     
  onRouteSelect,       
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const setRef = (el: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    if (containerRefProp) containerRefProp.current = el
  }
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.TileLayer | null>(null)
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  const routeLayersRef = useRef<Map<string, L.Polyline>>(new Map())


  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const container = containerRef.current

    // Create map
    const map = L.map(container, {
      center: mapCenter,
      zoom: mapZoom,
      zoomControl: false,
    })
    mapRef.current = map

    // Add initial tile layer
    const tileUrl =
      mapLayer === 'standard'
        ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

    const layer = L.tileLayer(tileUrl, { 
      attribution: '',
      keepBuffer: 2,
    })
    layer.addTo(map)
    layerRef.current = layer

    // Add zoom control
    L.control.zoom({ position: 'bottomleft' }).addTo(map)

    // Sync map size after first layout (container may not have had final size at creation)
    const syncSize = () => {
      if (containerRef.current && containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0 && mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }
    requestAnimationFrame(syncSize)
    setTimeout(syncSize, 50)
    setTimeout(syncSize, 200)

    // ResizeObserver: when container size changes, redraw map (only when container has valid size)
    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !mapRef.current) return
      const el = containerRef.current
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        mapRef.current.invalidateSize()
      }
    })
    ro.observe(container)

    // Cleanup on unmount
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      layerRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Handle map click for point selection - read selectionModeRef so this effect never depends on selectionMode (avoids re-run → tiles stay)
  useEffect(() => {
    if (!mapRef.current) return

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (selectionModeRef.current) {
        onSelect(e.latlng.lat, e.latlng.lng)
      }
    }

    mapRef.current.on('click', handleClick)

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleClick)
      }
    }
  }, [selectionModeRef, onSelect])

  // Update map view when center/zoom changes
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setView(mapCenter, mapZoom, { animate: true })
  }, [mapCenter, mapZoom])

  // Handle tile layer changes
  useEffect(() => {
    if (!mapRef.current) return

    // Remove old layer
    if (layerRef.current) {
      layerRef.current.remove()
    }

    // Add new layer
    const tileUrl =
      mapLayer === 'standard'
        ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

    const newLayer = L.tileLayer(tileUrl, { 
      attribution: '',
      keepBuffer: 2,
    })
    newLayer.addTo(mapRef.current)
    layerRef.current = newLayer
  }, [mapLayer])

  // Update markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear existing markers only (never touch tile layer)
    markersRef.current.forEach((marker) => {
      map.removeLayer(marker)
    })
    markersRef.current.clear()

    // Add custom start point marker
    if (startPoint && !mockLocations.find((loc) => loc.name === startPoint.name)) {
      const marker = L.circleMarker([startPoint.lat, startPoint.lng], {
        color: '#10B981',
        weight: 3,
        fillColor: '#10B981',
        fillOpacity: 0.9,
        radius: 11,
      })
      marker.bindPopup('<div class="text-xs font-semibold">Start Point</div>')
      marker.addTo(map)
      markersRef.current.set(`start-${startPoint.id}`, marker)
    }

    // Add custom end point marker
    if (endPoint && !mockLocations.find((loc) => loc.name === endPoint.name)) {
      const marker = L.circleMarker([endPoint.lat, endPoint.lng], {
        color: '#EF4444',
        weight: 3,
        fillColor: '#EF4444',
        fillOpacity: 0.9,
        radius: 10,
      })
      marker.bindPopup('<div class="text-xs font-semibold">End Point</div>')
      marker.addTo(map)
      markersRef.current.set(`end-${endPoint.id}`, marker)
    }

    // Ensure tile layer is still on map and visible (re-add if needed)
    if (layerRef.current && !map.hasLayer(layerRef.current)) {
      layerRef.current.addTo(map)
    }

    // After layout updates, force Leaflet to recalc size and redraw tiles
    const container = containerRef.current
    const safeInvalidate = () => {
      if (!container || !map) return
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        map.invalidateSize()
      }
    }
    requestAnimationFrame(safeInvalidate)
    const t1 = setTimeout(safeInvalidate, 100)
    const t2 = setTimeout(safeInvalidate, 400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [mockLocations, startPoint, endPoint, selectedLocation])

    //function to determine route color based on sun exposure (blue=cool, red=hot), for multi-route display
    function getRouteColor(sunExposure: number): string {
    const MIN = 30   // cool threshold
    const MAX = 85   // hot threshold

    // Clamp value
    const clamped = Math.min(Math.max(sunExposure, MIN), MAX)

    const ratio = (clamped - MIN) / (MAX - MIN)

    // Blue (240) → Red (0)
    const hue = 240 - ratio * 240

    return `hsl(${hue}, 100%, 50%)`
  }
  //for multi routes display, need to clear old route layers and add all routes, with selected one highlighted
  useEffect(() => {
  const map = mapRef.current
  if (!map) return

  // Clear old route layers
  routeLayersRef.current.forEach((polyline) => {
    map.removeLayer(polyline)
  })
  routeLayersRef.current.clear()

  // Add all routes
  routes.forEach((route) => {
    const latLngs = route.points.map(p => [p.lat, p.lng] as [number, number])

    const polyline = L.polyline(latLngs, {
      color: getRouteColor(route.sunExposure),
      weight: selectedRouteId === route.id ? 7 : 4,
      opacity: selectedRouteId === route.id ? 1 : 0.5,
    })

    polyline.on('click', () => {
      onRouteSelect(route.id)
    })

    polyline.addTo(map)
    routeLayersRef.current.set(route.id, polyline)
  })

}, [routes, selectedRouteId, onRouteSelect])


  return (
    <div
      ref={setRef}
      className="w-full h-full"
      style={{ 
        position: 'relative',
        minHeight: '100%',
        minWidth: '100%',
        backgroundColor: '#1f2937',
        zIndex: 0
      }}
    />
  )
}
