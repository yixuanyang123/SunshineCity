'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { Location } from '@/lib/types'

type MapLayer = 'standard' | 'satellite'

type MockLocation = {
  name: string
  lat: number
  lng: number
  comfort: number
}

interface LeafletMapProps {
  mapCenter: [number, number]
  mapZoom: number
  mapLayer: MapLayer
  selectionMode: 'start' | 'end' | null
  mockLocations: MockLocation[]
  startPoint: Location | null
  endPoint: Location | null
  selectedLocation: string | null
  onLocationClick: (location: MockLocation) => void
  onSelect: (lat: number, lng: number) => void
}

export default function LeafletMap({
  mapCenter,
  mapZoom,
  mapLayer,
  selectionMode,
  mockLocations,
  startPoint,
  endPoint,
  selectedLocation,
  onLocationClick,
  onSelect,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.TileLayer | null>(null)
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map())

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Create map
    const map = L.map(containerRef.current, {
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

    const layer = L.tileLayer(tileUrl, { attribution: '' })
    layer.addTo(map)
    layerRef.current = layer

    // Add zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Handle map click for point selection
    map.on('click', (e) => {
      if (selectionMode) {
        onSelect(e.latlng.lat, e.latlng.lng)
      }
    })

    // Cleanup on unmount
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
      markersRef.current.clear()
    }
  }, [])

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
      mapRef.current.removeLayer(layerRef.current)
    }

    // Add new layer
    const tileUrl =
      mapLayer === 'standard'
        ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

    const newLayer = L.tileLayer(tileUrl, { attribution: '' })
    newLayer.addTo(mapRef.current)
    layerRef.current = newLayer
  }, [mapLayer])

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapRef.current!.removeLayer(marker)
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
      marker.addTo(mapRef.current)
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
      marker.addTo(mapRef.current)
      markersRef.current.set(`end-${endPoint.id}`, marker)
    }
  }, [mockLocations, startPoint, endPoint, selectedLocation, onLocationClick])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${selectionMode ? 'cursor-crosshair' : ''}`}
      style={{ position: 'relative' }}
    />
  )
}
