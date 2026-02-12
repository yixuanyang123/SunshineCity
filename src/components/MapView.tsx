'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Search, X, ChevronUp, ChevronDown, Clock} from 'lucide-react'
import { mockRoutePlan, searchLocations } from '@/lib/mockData'
import { Location, Route } from '@/lib/types'
import dynamic from 'next/dynamic'

// Keep dynamic + ssr:false so Leaflet (browser-only) never runs on server.
// key="main-map" keeps identity stable; loading="lazy" may reduce remount risk.
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false })

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
  'New York': {
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
  selectedCity = 'New York',
  setSelectedCity,
  weather,
  onRouteRequest,
}: MapViewProps) {
  const cityInfo = CITY_DATA[selectedCity] || CITY_DATA['New York']
  const mockLocations = cityInfo.locations
  const { minLat, maxLat, minLng, maxLng } = cityInfo.bbox
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [travelMode, setTravelMode] = useState<'walking' | 'cycling'>('walking')
  const [hour, setHour] = useState<number>(new Date().getHours());
  const [minute, setMinute] = useState<number>(Math.round(new Date().getMinutes() / 10) * 10);

  const [routes, setRoutes] = useState<Route[]>([]) //stores all routes
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [routeSummary, setRouteSummary] = useState<{
    distance: number
    duration: number
    sunExposure: number
    color: string
  } | null>(null)

  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite'>('standard')
  
  const [isMounted, setIsMounted] = useState(false)
  const [isPanelVisible, setIsPanelVisible] = useState(true)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Start and end point selection
  const [startPoint, setStartPoint] = useState<Location | null>(null)
  const [endPoint, setEndPoint] = useState<Location | null>(null)
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | null>(null)
  const selectionModeRef = useRef<'start' | 'end' | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  selectionModeRef.current = selectionMode

  // Update cursor on map container without re-rendering LeafletMap (so tiles don't disappear)
  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return
    if (selectionMode) el.classList.add('cursor-crosshair')
    else el.classList.remove('cursor-crosshair')
  }, [selectionMode])

  // Search functionality
  const [startSearchQuery, setStartSearchQuery] = useState('')
  const [endSearchQuery, setEndSearchQuery] = useState('')
  const [startSearchResults, setStartSearchResults] = useState<Location[]>([])
  const [endSearchResults, setEndSearchResults] = useState<Location[]>([])
  const [showStartResults, setShowStartResults] = useState(false)
  const [showEndResults, setShowEndResults] = useState(false)

  // Clear search results when entering selection mode
  useEffect(() => {
    if (selectionMode) {
      setShowStartResults(false)
      setShowEndResults(false)
    }
  }, [selectionMode])

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

  const handleMapSelect = (lat: number, lng: number) => {
    const newLocation: Location = {
      id: `custom-${Date.now()}`,
      name: 'Custom Location',
      lat,
      lng,
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
      const departureDate = new Date();
      departureDate.setHours(hour);
      departureDate.setMinutes(minute);
      departureDate.setSeconds(0);

      const nowIso = departureDate.toISOString()
      const plan = mockRoutePlan(startPoint, endPoint, travelMode, nowIso, lightMode)

      setRoutes(plan.routes)

      const defaultRoute = plan.routes[0]
      setSelectedRouteId(defaultRoute.id)

      setRouteSummary({
        distance: defaultRoute.distance,
        duration: defaultRoute.duration,
        sunExposure: defaultRoute.sunExposure,
        color: defaultRoute.color,
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

  const getSeason = (date: Date): 'Winter' | 'Spring' | 'Summer' | 'Autumn' => {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Spring';   // March - May
  if (month >= 5 && month <= 7) return 'Summer';   // June - Aug
  if (month >= 8 && month <= 10) return 'Autumn';  // Sept - Nov
  return 'Winter';                                 // Dec - Feb
  };

const getLightDefault = () => {
  const season = getSeason(new Date())
  if (season === 'Spring' || season === 'Winter') {
    return 'sun'
  }
  return 'shade'
}

  const setStartTimeToNow = () => {
    const now = new Date()
    let currentHours = now.getHours();
    let currentMinutes = Math.round(now.getMinutes() / 10) * 10

    if (currentMinutes === 60) {
    currentMinutes = 0;
    currentHours = (currentHours + 1) % 24;
    }

    setHour(currentHours)
    setMinute(currentMinutes)
  }

  const handleRouteSelect = (routeId: string) => {
  setSelectedRouteId(routeId)

  const selected = routes.find(r => r.id === routeId)
  if (!selected) return

  setRouteSummary({
    distance: selected.distance,
    duration: selected.duration,
    sunExposure: selected.sunExposure,
    color: selected.color,
  })
  }
  
  const [lightMode, setLightMode] = useState<'sun' | 'shade'>(getLightDefault())
  const defaultSpeed = getDefaultSpeed()

  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2
  const mapCenter: [number, number] = [centerLat, centerLng]
  const mapZoom = 12

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
      <div className="absolute top-4 left-4 z-[5] bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl max-w-md">
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

            {/* Light/Shade Mode Toggle */}
            <div>
              <label className="text-xs text-gray-300 flex items-center gap-2 mb-1">Light preference</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLightMode('sun')}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                    lightMode === 'sun'
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Prefer Sunlight
                </button>
                <button
                  onClick={() => setLightMode('shade')}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                    lightMode === 'shade'
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Prefer Shade
                </button>
              </div>
              <div className="mt-1 text-[10px] text-gray-400">
                Default is {lightMode === 'sun' ? 'sunlight' : 'shade'} for {lightMode === 'sun' ? 'Spring/Winter' : 'Summer/Autumn'}
              </div>
            </div>

          {/* Start Time Selection */}
          <div>
            <label className="text-xs text-gray-300 flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3" /> Departure Time
            </label>
            <div className="flex items-center gap-2 ">
              <select value = {hour} onChange={(e) => setHour(parseInt(e.target.value))} className="flex-1 bg-gray-800 text-white text-xs p-1 rounded"> 
                {Array.from({ length: 24 }, (_, i) => (<option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                  ))}
              </select>
              <span className="text-gray-400">:</span>
              <select value={minute} onChange={(e) => setMinute(parseInt(e.target.value))} className="flex-1 bg-gray-800 text-white text-xs p-1 rounded">
                {Array.from({ length: 6 }, (_, i) => (<option key={i} value={i * 10}>{String(i * 10).padStart(2, '0')}</option>
                  ))}
              </select>
              <button onClick={setStartTimeToNow} className="ml-2 px-2 py-1.5 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600 transition-all">Set to Current Time</button>
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
          <div className="pt-2 border-t border-gray-700 space-y-1">
      <div className="text-[10px] text-gray-400 text-center">
        Sun Exposure Scale
      </div>

      {/* Gradient Bar Legend*/}
      <div
        className="h-2 w-full rounded-full"
        style={{
          background:
            'linear-gradient(to right, hsl(240,100%,50%), hsl(120,100%,50%), hsl(60,100%,50%), hsl(0,100%,50%))',
        }}
      />

      {/* Scale Labels */}
      <div className="flex justify-between text-[9px] text-gray-500">
        <span>30% Cool</span>
        <span>~60%</span>
        <span>85% Hot</span>
      </div>
    </div>

  </div>
)}

        </div>
      )}
      </div>

      {/* City + Layer Selector - Top Right */}
      <div className="absolute top-4 right-4 z-[5] bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl px-3 py-2 w-48 space-y-2">
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">City</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity && setSelectedCity(e.target.value)}
            className="bg-transparent text-xs text-gray-200 outline-none w-full"
          >
            {Object.keys(CITY_DATA).map((c) => (
              <option key={c} value={c} className="text-black">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Base Map</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMapLayer('standard')}
              className={`px-2 py-1.5 rounded text-[11px] transition-all border ${
                mapLayer === 'standard'
                  ? 'bg-yellow-500 text-gray-900 border-yellow-500'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-2 py-1.5 rounded text-[11px] transition-all border ${
                mapLayer === 'satellite'
                  ? 'bg-yellow-500 text-gray-900 border-yellow-500'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="relative w-full h-full flex flex-col min-h-0">
        {/* Map Container - min-h-0 lets flex shrink; min height keeps map visible after layout changes */}
        <div className="flex-1 relative p-3 min-h-0" style={{ minHeight: 300 }}>
          {/* Hint as sibling of map container so we never add/remove nodes inside map container (prevents map unmount) */}
          {selectionMode && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[10] px-4 py-2.5 bg-gray-900 border-2 border-yellow-400 rounded-lg shadow-lg text-yellow-300 text-sm font-semibold whitespace-nowrap pointer-events-none">
              Click anywhere on map to set {selectionMode} point
            </div>
          )}
          <div 
            key="map-container"
            className="w-full h-full relative rounded-xl border-2 border-yellow-500/30 overflow-hidden"
            style={{ backgroundColor: '#1a1a1a', minHeight: 280 }}
          >
            {isMounted && (
              <LeafletMap
                key="main-map"
                containerRef={mapContainerRef}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                mapLayer={mapLayer}
                selectionModeRef={selectionModeRef}
                mockLocations={mockLocations}
                startPoint={startPoint}
                endPoint={endPoint}
                selectedLocation={selectedLocation}
                onLocationClick={handleLocationClick}
                onSelect={handleMapSelect}
                routes={routes}
                selectedRouteId={selectedRouteId}
                onRouteSelect={handleRouteSelect}
              />
            )}


          </div>
        </div>

        {/* Controls Bar */}
        <div className="px-3 py-1.5 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700 flex items-center justify-center">
          <p className="text-gray-400 text-xs">© Cornell University AEXUS</p>
        </div>
      </div>
    </div>
  )
}
