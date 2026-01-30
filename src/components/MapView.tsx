'use client'

import { useEffect, useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'

interface MapViewProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void
}

// Mock GeoJSON data for city locations
const mockLocations = [
  { name: 'Central Park', lat: 40.785, lng: -73.968, comfort: 85 },
  { name: 'Downtown Plaza', lat: 40.758, lng: -73.985, comfort: 72 },
  { name: 'Riverside Walk', lat: 40.791, lng: -73.972, comfort: 92 },
  { name: 'Market District', lat: 40.745, lng: -73.99, comfort: 65 },
  { name: 'Tech Hub', lat: 40.768, lng: -73.98, comfort: 78 },
]

export default function MapView({ onLocationSelect }: MapViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  const handleLocationClick = (location: (typeof mockLocations)[0]) => {
    setSelectedLocation(location.name)
    onLocationSelect({
      lat: location.lat,
      lng: location.lng,
      name: location.name,
    })
  }

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

      {/* Map Content */}
      <div className="relative w-full h-full flex flex-col">
        {/* Map Container */}
        <div className="flex-1 relative p-8">
          <div className="w-full h-full rounded-2xl border-2 border-yellow-500/30 bg-gray-800/50 backdrop-blur-sm overflow-hidden">
            {/* Simplified Map Visualization */}
            <svg className="w-full h-full" viewBox="0 0 400 300">
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
                // Convert lat/lng to SVG coordinates
                // NYC bounding box: lat ~40.7-40.8, lng ~-74.0 to -73.95
                const minLat = 40.70, maxLat = 40.80
                const minLng = -74.0, maxLng = -73.95
                
                const x = ((location.lng - minLng) / (maxLng - minLng)) * 340 + 30
                const y = ((maxLat - location.lat) / (maxLat - minLat)) * 200 + 30

                return (
                  <g key={location.name}>
                    {/* Pulsing Circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="none"
                      stroke="#FBBF24"
                      strokeWidth="2"
                      opacity={selectedLocation === location.name ? 1 : 0.5}
                      className="animate-pulse"
                    />

                    {/* Center Dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill={
                        selectedLocation === location.name
                          ? '#FF6B35'
                          : location.comfort > 80
                            ? '#34D399'
                            : location.comfort > 60
                              ? '#FBBF24'
                              : '#EF4444'
                      }
                      className="cursor-pointer hover:r-6 transition-all"
                      onClick={() => handleLocationClick(location)}
                    />

                    {/* Label */}
                    {selectedLocation === location.name && (
                      <g>
                        <rect
                          x={x - 50}
                          y={y - 48}
                          width="100"
                          height="40"
                          fill="#1F2937"
                          stroke="#FBBF24"
                          strokeWidth="1.5"
                          rx="6"
                        />
                        <text
                          x={x}
                          y={y - 30}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#FCD34D"
                          className="font-bold"
                        >
                          {location.name}
                        </text>
                        <text
                          x={x}
                          y={y - 16}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#D1D5DB"
                          className="font-semibold"
                        >
                          Comfort: {location.comfort}%
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}

              {/* Legend */}
              <g>
                <rect x="10" y="250" width="100" height="40" fill="#1F2937" stroke="#4B5563" rx="4" />
                <circle cx="20" cy="260" r="3" fill="#34D399" />
                <text x="30" y="265" fontSize="10" fill="#D1D5DB">
                  High Comfort
                </text>
                <circle cx="20" cy="280" r="3" fill="#FBBF24" />
                <text x="30" y="285" fontSize="10" fill="#D1D5DB">
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
