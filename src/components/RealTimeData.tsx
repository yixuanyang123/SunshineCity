'use client'

import { useState } from 'react'
import { Droplets, Wind, ChevronUp, ChevronDown } from 'lucide-react'

interface RealTimeDataProps {
  data: {
    temperature: number
    humidity: number
    windSpeed: number
    uvIndex: number
  }
}

export default function RealTimeData({ data }: RealTimeDataProps) {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <div className="absolute bottom-6 right-6 bg-gray-900/95 backdrop-blur-sm border border-yellow-500/30 rounded-lg shadow-2xl w-80">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h4 className="font-semibold text-yellow-400 text-sm">Real-Time Environmental Factors</h4>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          aria-label={isVisible ? "Collapse panel" : "Expand panel"}
        >
          {isVisible ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {isVisible && (
        <>
          <div className="p-4 space-y-3">
        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
          <span className="text-gray-300 text-sm">Temperature</span>
          <span className="text-yellow-300 font-mono font-semibold">{data.temperature.toFixed(1)}°C</span>
        </div>

        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Droplets className="w-4 h-4 text-blue-400" />
            Humidity
          </div>
          <span className="text-blue-300 font-mono font-semibold">{data.humidity.toFixed(0)}%</span>
        </div>

        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Wind className="w-4 h-4 text-cyan-400" />
            Wind Speed
          </div>
          <span className="text-cyan-300 font-mono font-semibold">{data.windSpeed.toFixed(1)} m/s</span>
        </div>

        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
          <span className="text-gray-300 text-sm">UV Index</span>
          <span className="text-orange-300 font-mono font-semibold">{data.uvIndex.toFixed(1)}</span>
        </div>

      </div>

      <div className="px-4 pb-4 pt-2 border-t border-gray-700">
        <p className="text-xs text-gray-500">Updates every 10 seconds</p>
      </div>
        </>
      )}
    </div>
  )
}
