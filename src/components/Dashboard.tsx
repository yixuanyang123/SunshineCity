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
  const [selectedCity, setSelectedCity] = useState<string>('Manhattan')
  const [weather, setWeather] = useState({
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    uvIndex: 0,
  })

  useEffect(() => {
    const coords = CITY_COORDS[selectedCity] || CITY_COORDS.Manhattan
    const controller = new AbortController()

    const loadWeather = async () => {
      try {
        const params = new URLSearchParams({
          latitude: String(coords.lat),
          longitude: String(coords.lng),
          timezone: 'auto',
          current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index',
        })
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch weather')
        }

        const data = await response.json()
        const current = data.current || {}

        setWeather({
          temperature: Number(current.temperature_2m ?? 0),
          humidity: Number(current.relative_humidity_2m ?? 0),
          windSpeed: Number(current.wind_speed_10m ?? 0),
          uvIndex: Number(current.uv_index ?? 0),
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setWeather((prev) => prev)
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
          {(activeTab === 'map' || activeTab === '3d') && <RealTimeData data={weather} selectedCity={selectedCity} />}
        </div>
      </div>
    </div>
  )
}
