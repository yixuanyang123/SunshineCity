'use client'

import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import MapView from './MapView'
import DataPanel from './DataPanel'
import RealTimeData from './RealTimeData'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'map' | 'analysis' | '3d'>('map')
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    name: string
  } | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>('Manhattan')

  return (
    <div className="flex flex-col w-full h-screen bg-gradient-to-br from-gray-900 via-secondary to-dark">
      {/* Header */}
      <Header selectedCity={selectedCity} setSelectedCity={setSelectedCity} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Map/Content Area */}
        <div className="flex-1 relative">
          {activeTab === 'map' && <MapView onLocationSelect={setSelectedLocation} selectedCity={selectedCity} />}
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
              <DataPanel location={selectedLocation} />
            </div>
          )}

          {/* Real-time Data Panel - Only show on map and 3d */}
          {(activeTab === 'map' || activeTab === '3d') && <RealTimeData />}
        </div>
      </div>
    </div>
  )
}
