'use client'

import { useEffect, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import MapView from './MapView'
import DataPanel from './DataPanel'
import RealTimeData from './RealTimeData'
import { CITY_COORDS } from '@/lib/cityData'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'map' | 'analysis' | '3d'>('map')
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    name: string
  } | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>('New York')
  const [weather, setWeather] = useState({
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    uvIndex: 0,
  })
  const [weatherError, setWeatherError] = useState<string | null>(null)

  useEffect(() => {
    const coords = CITY_COORDS[selectedCity] || CITY_COORDS['New York']
    const controller = new AbortController()
    const apiUrl = '/api/weather'

    const loadWeather = async () => {
      setWeatherError(null)
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: coords.lat, lon: coords.lng }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`)
        }

        const raw = await response.json()
        const data = raw?.body && typeof raw.body === 'string' ? JSON.parse(raw.body) : raw

        const temp = data?.temperature?.value ?? data?.temperature ?? 0
        const humidityVal = data?.humidity?.value ?? data?.humidity ?? 0
        const uvVal = data?.uv_index?.value ?? data?.uv_index ?? data?.uvIndex ?? 0
        const windVal = data?.wind_speed?.value ?? data?.wind_speed ?? data?.windSpeed ?? 0
        const windUnit = (data?.wind_speed?.unit ?? data?.windSpeed?.unit ?? '').toLowerCase()
        const windKmh = windUnit.includes('m/s') || windUnit === 'm/s' ? Number(windVal) * 3.6 : Number(windVal)

        setWeather({
          temperature: Number(temp),
          humidity: Number(humidityVal),
          windSpeed: Number(windKmh),
          uvIndex: Number(uvVal),
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const msg = err instanceof Error ? err.message : 'Failed to load weather'
          setWeatherError(msg)
          if (process.env.NODE_ENV === 'development') {
            console.error('[Weather API]', msg, err)
          }
        }
      }
    }

    loadWeather()
    const interval = setInterval(loadWeather, 15 * 60 * 1000)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [selectedCity])

  return (
    <div className="flex flex-col w-full h-screen bg-gradient-to-br from-gray-900 via-secondary to-dark">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Map/Content Area */}
        <div className="flex-1 relative">
          {activeTab === 'map' && (
            <MapView
              onLocationSelect={setSelectedLocation}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              weather={weather}
            />
          )}
          {activeTab === '3d' && (
            <div className="w-full h-full bg-dark flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-2xl font-bold mb-4">3D Urban Model</p>
                <p className="text-gray-500">Three.js 3D visualization coming soon...</p>
              </div>
            </div>
          )}
          {activeTab === 'analysis' && (
            <div className="w-full h-full bg-dark p-6 overflow-y-auto">
              <DataPanel
                location={selectedLocation}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
              />
            </div>
          )}

          {/* Real-time Data Panel - Only show on map and 3d */}
          {(activeTab === 'map' || activeTab === '3d') && <RealTimeData data={weather} selectedCity={selectedCity} error={weatherError} />}
        </div>
      </div>
    </div>
  )
}
