'use client'

import { useEffect, useState } from 'react'
import { MapPin, Navigation, Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { mockRoutePlan, searchLocations } from '@/lib/mockData'
import { Location } from '@/lib/types'

interface MapViewProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void
  selectedCity?: string
  setSelectedCity?: (c: string) => void
  weather?: {
    temperature: number
    humidity: number
    windSpeed: number
    uvIndex: number
  }
  onRouteRequest?: (start: Location, end: Location) => void
}

const CITY_DATA: Record<
  string,
  { locations: { name: string; lat: number; lng: number; comfort: number }[]; bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number } }
> = {
  Manhattan: {
    locations: [
      { name: 'Central Park', lat: 40.785, lng: -73.968, comfort: 85 },
      { name: 'Downtown Plaza', lat: 40.758, lng: -73.985, comfort: 72 },
      { name: 'Riverside Walk', lat: 40.791, lng: -73.972, comfort: 92 },
      { name: 'Market District', lat: 40.745, lng: -73.99, comfort: 65 },
      { name: 'Tech Hub', lat: 40.768, lng: -73.98, comfort: 78 },
    ],
    bbox: { minLat: 40.70, maxLat: 40.80, minLng: -74.0, maxLng: -73.95 },
  },
  'Los Angeles': {
    locations: [
      { name: 'Griffith Park', lat: 34.136, lng: -118.294, comfort: 78 },
      { name: 'Santa Monica Pier', lat: 34.009, lng: -118.497, comfort: 82 },
      { name: 'Downtown LA', lat: 34.040, lng: -118.246, comfort: 68 },
    ],
    bbox: { minLat: 33.9, maxLat: 34.3, minLng: -118.6, maxLng: -118.1 },
  },
  Boston: {
    locations: [
      { name: 'Boston Common', lat: 42.355, lng: -71.065, comfort: 80 },
      { name: 'Cambridge Square', lat: 42.373, lng: -71.119, comfort: 74 },
    ],
    bbox: { minLat: 42.34, maxLat: 42.38, minLng: -71.14, maxLng: -71.05 },
  },
  Miami: {
    locations: [
      { name: 'South Beach', lat: 25.790, lng: -80.130, comfort: 86 },
      { name: 'Downtown Miami', lat: 25.774, lng: -80.193, comfort: 70 },
    ],
    bbox: { minLat: 25.72, maxLat: 25.82, minLng: -80.25, maxLng: -80.05 },
  },
  'San Diego': {
    locations: [
      { name: 'Balboa Park', lat: 32.734, lng: -117.144, comfort: 84 },
      { name: 'Gaslamp Quarter', lat: 32.711, lng: -117.161, comfort: 73 },
    ],
    bbox: { minLat: 32.70, maxLat: 32.75, minLng: -117.20, maxLng: -117.12 },
  },
}

export default function MapView({
  onLocationSelect,
  selectedCity = 'Manhattan',
  setSelectedCity,
  weather,
  onRouteRequest,
}: MapViewProps) {
  const cityInfo = CITY_DATA[selectedCity] || CITY_DATA['Manhattan']
  const mockLocations = cityInfo.locations
  const { minLat, maxLat, minLng, maxLng } = cityInfo.bbox
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [travelMode, setTravelMode] = useState<'walking' | 'cycling'>('walking')
  const [routeSummary, setRouteSummary] = useState<{
    distance: number
    duration: number
    sunExposure: number
    color: string
  } | null>(null)
  
  // Panel visibility
  const [isPanelVisible, setIsPanelVisible] = useState(true)
  
  // Start and end point selection
  const [startPoint, setStartPoint] = useState<Location | null>(null)
  const [endPoint, setEndPoint] = useState<Location | null>(null)
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | null>(null)
  
  // Search functionality
  const [startSearchQuery, setStartSearchQuery] = useState('')
  const [endSearchQuery, setEndSearchQuery] = useState('')
  const [startSearchResults, setStartSearchResults] = useState<Location[]>([])
  const [endSearchResults, setEndSearchResults] = useState<Location[]>([])
  const [showStartResults, setShowStartResults] = useState(false)
  const [showEndResults, setShowEndResults] = useState(false)

  // Update search results
  useEffect(() => {
    if (startSearchQuery.trim()) {
      const results = searchLocations(startSearchQuery)
      setStartSearchResults(results)
      setShowStartResults(true)
    } else {
      setStartSearchResults([])
      setShowStartResults(false)
    }
  }, [startSearchQuery])

  useEffect(() => {
    if (endSearchQuery.trim()) {
      const results = searchLocations(endSearchQuery)
      setEndSearchResults(results)
      setShowEndResults(true)
    } else {
      setEndSearchResults([])
      setShowEndResults(false)
    }
  }, [endSearchQuery])

  const handleLocationClick = (location: (typeof mockLocations)[0]) => {
    setSelectedLocation(location.name)
    onLocationSelect({
      lat: location.lat,
      lng: location.lng,
      name: location.name,
    })
    
    // If in selection mode, set as start or end point
    if (selectionMode === 'start') {
      setStartPoint({
        id: location.name,
        name: location.name,
        lat: location.lat,
        lng: location.lng,
      })
      setStartSearchQuery(location.name)
      setSelectionMode(null)
    } else if (selectionMode === 'end') {
      setEndPoint({
        id: location.name,
        name: location.name,
        lat: location.lat,
        lng: location.lng,
      })
      setEndSearchQuery(location.name)
      setSelectionMode(null)
    }
  }

  const handleSearchResultClick = (location: Location, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartPoint(location)
      setStartSearchQuery(location.name)
      setShowStartResults(false)
    } else {
      setEndPoint(location)
      setEndSearchQuery(location.name)
      setShowEndResults(false)
    }
  }

  const clearStartPoint = () => {
    setStartPoint(null)
    setStartSearchQuery('')
  }

  const clearEndPoint = () => {
    setEndPoint(null)
    setEndSearchQuery('')
  }

  const handleFindRoute = () => {
    if (startPoint && endPoint && onRouteRequest) {
      onRouteRequest(startPoint, endPoint)
    }
    if (startPoint && endPoint) {
      const nowIso = new Date().toISOString()
      const plan = mockRoutePlan(startPoint, endPoint, travelMode, nowIso, 'sun')
      const best = plan.routes[0]
      setRouteSummary({
        distance: best.distance,
        duration: best.duration,
        sunExposure: best.sunExposure,
        color: best.color,
      })
    }
  }

  const getDefaultSpeed = () => {
    const baseSpeed = travelMode === 'walking' ? 5 : 15
    if (!weather) return baseSpeed

    let factor = 1
    const { temperature, humidity, windSpeed, uvIndex } = weather

    if (temperature >= 30) factor -= 0.1
    if (temperature <= 5) factor -= 0.15
    if (humidity >= 80) factor -= 0.05
    if (uvIndex >= 8) factor -= 0.05
    if (windSpeed >= 8) factor -= travelMode === 'cycling' ? 0.12 : 0.06

    const adjusted = baseSpeed * Math.max(0.7, factor)
    return Math.round(adjusted * 10) / 10
  }

  const defaultSpeed = getDefaultSpeed()

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-gray-900 to-dark overflow-hidden">
      {/* Map Background with Grid */}
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-10" viewBox="0 0 1000 1000">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="1000" height="1000" fill="url(#grid)" />
        </svg>
      </div>

      {/* Route Selection Panel - Compact Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl max-w-md">
        {/* Header with collapse button */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-yellow-400" />
            <h3 className="text-yellow-400 font-semibold text-sm">Route Planning</h3>
          </div>
          <button
            onClick={() => setIsPanelVisible(!isPanelVisible)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label={isPanelVisible ? "Collapse panel" : "Expand panel"}
          >
            {isPanelVisible ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        
        {isPanelVisible && (
          <div className="p-3 space-y-2">
            {/* Travel Mode Toggle */}
            <div>
              <label className="text-xs text-gray-300 flex items-center gap-2 mb-1">Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTravelMode('walking')}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                    travelMode === 'walking'
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Walking
                </button>
                <button
                  onClick={() => setTravelMode('cycling')}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                    travelMode === 'cycling'
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Cycling
                </button>
              </div>
              <div className="mt-1 text-[10px] text-gray-400">
                Default speed: {defaultSpeed} km/h (weather-adjusted)
              </div>
            </div>
          {/* Start Point Selection */}
          <div>
            <label className="text-xs text-gray-300 flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Start Point
            </label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={startSearchQuery}
                    onChange={(e) => setStartSearchQuery(e.target.value)}
                    onFocus={() => setShowStartResults(true)}
                    placeholder="Search or click map..."
                    className="w-full pl-9 pr-9 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-green-500"
                  />
                  {startPoint && (
                    <button
                      onClick={clearStartPoint}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setSelectionMode(selectionMode === 'start' ? null : 'start')}
                  className={`px-2 py-1.5 rounded text-xs transition-all ${
                    selectionMode === 'start'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                </button>
              </div>
              
              {/* Search Results Dropdown */}
              {showStartResults && startSearchResults.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded shadow-lg z-20 max-h-40 overflow-y-auto">
                  {startSearchResults.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleSearchResultClick(location, 'start')}
                      className="w-full text-left px-2 py-1.5 hover:bg-gray-700 text-white text-xs border-b border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium">{location.name}</div>
                      {location.address && (
                        <div className="text-[10px] text-gray-400 truncate">{location.address}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* End Point Selection */}
          <div>
            <label className="text-xs text-gray-300 flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              End Point
            </label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={endSearchQuery}
                    onChange={(e) => setEndSearchQuery(e.target.value)}
                    onFocus={() => setShowEndResults(true)}
                    placeholder="Search or click map..."
                    className="w-full pl-9 pr-9 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                  />
                  {endPoint && (
                    <button
                      onClick={clearEndPoint}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setSelectionMode(selectionMode === 'end' ? null : 'end')}
                  className={`px-2 py-1.5 rounded text-xs transition-all ${
                    selectionMode === 'end'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                </button>
              </div>
              
              {/* Search Results Dropdown */}
              {showEndResults && endSearchResults.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded shadow-lg z-20 max-h-40 overflow-y-auto">
                  {endSearchResults.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleSearchResultClick(location, 'end')}
                      className="w-full text-left px-2 py-1.5 hover:bg-gray-700 text-white text-xs border-b border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium">{location.name}</div>
                      {location.address && (
                        <div className="text-[10px] text-gray-400 truncate">{location.address}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        {/* Find Route Button */}
        {startPoint && endPoint && (
          <button
            onClick={handleFindRoute}
            className="mt-2 w-full py-1.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded text-xs transition-all"
          >
            Find Optimal Route
          </button>
        )}

        {/* Route Summary */}
        {routeSummary && (
          <div className="mt-2 px-2 py-1.5 rounded text-xs border border-gray-700 bg-gray-800/60">
            <div className="flex items-center justify-between text-gray-300">
              <span>Distance</span>
              <span className="font-mono">{routeSummary.distance} km</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span>Duration</span>
              <span className="font-mono">{routeSummary.duration} min</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span>Sun Exposure</span>
              <span className="font-mono">{routeSummary.sunExposure}%</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span>Mode Speed</span>
              <span className="font-mono">{defaultSpeed} km/h</span>
            </div>
          </div>
        )}

        {/* Selection Mode Hint */}
        {selectionMode && (
          <div className="mt-2 px-2 py-1.5 bg-blue-500/20 border border-blue-500/50 rounded text-blue-300 text-xs">
            Click anywhere on map to set {selectionMode} point
          </div>
        )}
        </div>
      )}
      </div>

      {/* City Selector - Top Right */}
      <div className="absolute top-4 right-4 z-10 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl px-3 py-2">
        <label className="block text-[10px] text-gray-400 mb-1">City</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity && setSelectedCity(e.target.value)}
          className="bg-transparent text-xs text-gray-200 outline-none"
        >
          {Object.keys(CITY_DATA).map((c) => (
            <option key={c} value={c} className="text-black">
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Map Content */}
      <div className="relative w-full h-full flex flex-col">
        {/* Map Container */}
        <div className="flex-1 relative p-8">
          <div className="w-full h-full rounded-2xl border-2 border-yellow-500/30 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
            {/* Simplified Map Visualization */}
            <svg 
              className={`w-full h-full ${selectionMode ? 'cursor-crosshair' : ''}`}
              viewBox="0 0 400 300"
              onClick={(e) => {
                if (!selectionMode) return
                
                const svg = e.currentTarget
                const rect = svg.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 400
                const y = ((e.clientY - rect.top) / rect.height) * 300
                
                // Convert SVG coordinates back to lat/lng
                const lng = (x - 30) / 340 * (maxLng - minLng) + minLng
                const lat = maxLat - (y - 30) / 200 * (maxLat - minLat)
                
                const newLocation: Location = {
                  id: `custom-${Date.now()}`,
                  name: `Custom Location`,
                  lat: lat,
                  lng: lng,
                }
                
                if (selectionMode === 'start') {
                  setStartPoint(newLocation)
                  setStartSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                  setSelectionMode(null)
                } else if (selectionMode === 'end') {
                  setEndPoint(newLocation)
                  setEndSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                  setSelectionMode(null)
                }
              }}
            >
              {/* Streets */}
              <g stroke="#374151" strokeWidth="2" fill="none">
                <line x1="0" y1="150" x2="400" y2="150" />
                <line x1="200" y1="0" x2="200" y2="300" />
                <path d="M 0 100 Q 100 50, 200 100 T 400 100" />
                <path d="M 50 0 Q 100 150, 50 300" />
                <path d="M 350 0 Q 300 150, 350 300" />
              </g>

              {/* Location Markers */}
              {mockLocations.map((location, idx) => {
                // Convert lat/lng to SVG coordinates using city bbox
                const x = ((location.lng - minLng) / (maxLng - minLng)) * 340 + 30
                const y = ((maxLat - location.lat) / (maxLat - minLat)) * 200 + 30

                // Check if this location is start or end point
                const isStartPoint = startPoint?.name === location.name
                const isEndPoint = endPoint?.name === location.name
                const isSelected = selectedLocation === location.name

                // Determine marker color
                let markerColor = '#FBBF24' // Default yellow
                let fillColor = location.comfort > 80
                  ? '#34D399'
                  : location.comfort > 60
                    ? '#FBBF24'
                    : '#EF4444'
                
                if (isStartPoint) {
                  markerColor = '#10B981' // Green for start
                  fillColor = '#10B981'
                } else if (isEndPoint) {
                  markerColor = '#EF4444' // Red for end
                  fillColor = '#EF4444'
                }

                const labelStack: Array<{
                  id: string
                  width: number
                  height: number
                  fill: string
                  stroke?: string
                  title: string
                  subtitle?: string
                  titleColor: string
                  subtitleColor?: string
                  titleSize: number
                  subtitleSize?: number
                }> = []

                if (isStartPoint) {
                  labelStack.push({
                    id: 'start',
                    width: 70,
                    height: 30,
                    fill: '#10B981',
                    title: 'START',
                    subtitle: location.name,
                    titleColor: '#FFFFFF',
                    subtitleColor: '#FFFFFF',
                    titleSize: 11,
                    subtitleSize: 9,
                  })
                }

                if (isEndPoint) {
                  // End point uses pin-only styling (no label) to reduce clutter
                }

                if (isSelected) {
                  labelStack.push({
                    id: 'info',
                    width: 110,
                    height: 40,
                    fill: '#1F2937',
                    stroke: '#FBBF24',
                    title: location.name,
                    subtitle: `Comfort: ${location.comfort}%`,
                    titleColor: '#FCD34D',
                    subtitleColor: '#D1D5DB',
                    titleSize: 11,
                    subtitleSize: 10,
                  })
                }

                return (
                  <g key={location.name}>
                    {/* End point pin */}
                    {isEndPoint ? (
                      <g onClick={() => handleLocationClick(location)} className="cursor-pointer">
                        <path
                          transform={`translate(${x},${y})`}
                          d="M 0 -16 C -6 -16 -10 -12 -10 -6 C -10 2 0 14 0 14 C 0 14 10 2 10 -6 C 10 -12 6 -16 0 -16 Z"
                          fill="#EF4444"
                          stroke="#FFFFFF"
                          strokeWidth="1"
                        />
                        <circle cx={x} cy={y - 6} r="3" fill="#FFFFFF" />
                      </g>
                    ) : (
                      <>
                        {/* Pulsing Circle */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isStartPoint ? "16" : "12"}
                          fill="none"
                          stroke={markerColor}
                          strokeWidth={isStartPoint ? "3" : "2"}
                          opacity={isSelected || isStartPoint ? 1 : 0.5}
                          className={isStartPoint ? "animate-pulse" : ""}
                        />

                        {/* Center Dot */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isStartPoint ? "6" : "4"}
                          fill={fillColor}
                          className={`cursor-pointer transition-all ${
                            selectionMode ? 'hover:r-8' : 'hover:r-6'
                          }`}
                          onClick={() => handleLocationClick(location)}
                        />
                      </>
                    )}

                    {/* Stacked Labels to avoid overlap */}
                    {labelStack.map((label, index) => {
                      const labelBottom = y - 18 - index * (label.height + 6)
                      const rectY = labelBottom - label.height
                      const rectX = x - label.width / 2
                      return (
                        <g key={`${location.name}-${label.id}`}>
                          <rect
                            x={rectX}
                            y={rectY}
                            width={label.width}
                            height={label.height}
                            fill={label.fill}
                            stroke={label.stroke}
                            strokeWidth={label.stroke ? 1.5 : 0}
                            rx="6"
                          />
                          <text
                            x={x}
                            y={rectY + 12}
                            textAnchor="middle"
                            fontSize={label.titleSize}
                            fill={label.titleColor}
                            className="font-bold"
                          >
                            {label.title}
                          </text>
                          {label.subtitle && (
                            <text
                              x={x}
                              y={rectY + (label.subtitleSize ? 24 : 22)}
                              textAnchor="middle"
                              fontSize={label.subtitleSize ?? 9}
                              fill={label.subtitleColor ?? '#FFFFFF'}
                              className="font-semibold"
                            >
                              {label.subtitle}
                            </text>
                          )}
                        </g>
                      )
                    })}
                  </g>
                )
              })}

              {/* Custom Start Point Marker (if not a named location) */}
              {startPoint && !mockLocations.find(loc => loc.name === startPoint.name) && (
                (() => {
                  const x = ((startPoint.lng - minLng) / (maxLng - minLng)) * 340 + 30
                  const y = ((maxLat - startPoint.lat) / (maxLat - minLat)) * 200 + 30
                  return (
                    <g>
                      <circle
                        cx={x}
                        cy={y}
                        r="16"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3"
                        className="animate-pulse"
                      />
                      <circle cx={x} cy={y} r="6" fill="#10B981" />
                      <rect
                        x={x - 35}
                        y={y - 45}
                        width="70"
                        height="24"
                        fill="#10B981"
                        rx="6"
                      />
                      <text
                        x={x}
                        y={y - 27}
                        textAnchor="middle"
                        fontSize="11"
                        fill="white"
                        className="font-bold"
                      >
                        START
                      </text>
                    </g>
                  )
                })()
              )}

              {/* Custom End Point Marker (if not a named location) */}
              {endPoint && !mockLocations.find(loc => loc.name === endPoint.name) && (
                (() => {
                  const x = ((endPoint.lng - minLng) / (maxLng - minLng)) * 340 + 30
                  const y = ((maxLat - endPoint.lat) / (maxLat - minLat)) * 200 + 30
                  return (
                    <g>
                      <path
                        transform={`translate(${x},${y})`}
                        d="M 0 -16 C -6 -16 -10 -12 -10 -6 C -10 2 0 14 0 14 C 0 14 10 2 10 -6 C 10 -12 6 -16 0 -16 Z"
                        fill="#EF4444"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                        className="animate-pulse"
                      />
                      <circle cx={x} cy={y - 6} r="3" fill="#FFFFFF" />
                    </g>
                  )
                })()
              )}

              {/* Legend */}
              <g>
                <rect x="10" y="220" width="120" height="70" fill="#1F2937" stroke="#4B5563" rx="4" />
                <circle cx="20" cy="235" r="3" fill="#10B981" />
                <text x="30" y="238" fontSize="10" fill="#D1D5DB">
                  Start Point
                </text>
                <circle cx="20" cy="250" r="3" fill="#EF4444" />
                <text x="30" y="253" fontSize="10" fill="#D1D5DB">
                  End Point
                </text>
                <circle cx="20" cy="265" r="3" fill="#34D399" />
                <text x="30" y="268" fontSize="10" fill="#D1D5DB">
                  High Comfort
                </text>
                <circle cx="20" cy="280" r="3" fill="#FBBF24" />
                <text x="30" y="283" fontSize="10" fill="#D1D5DB">
                  Medium Comfort
                </text>
              </g>
            </svg>

            {/* Location List Overlay */}
            <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 w-48">
              <h4 className="font-semibold text-yellow-400 text-sm mb-2 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Key Locations
              </h4>
              <div className="space-y-1">
                {mockLocations.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleLocationClick(loc)}
                    className={`w-full text-left px-2 py-1 rounded text-sm transition-all ${
                      selectedLocation === loc.name
                        ? 'bg-yellow-500/30 text-yellow-300 border-l-2 border-yellow-400'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {loc.name}
                    <span className="float-right">{loc.comfort}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="px-8 py-4 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700 flex items-center justify-between">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm transition-all border border-yellow-500/50">
              Shadow Analysis
            </button>
            <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-all border border-blue-500/50">
              Temperature Map
            </button>
          </div>
          <p className="text-gray-400 text-sm">Click on locations to view detailed analysis</p>
        </div>
      </div>
    </div>
  )
}
