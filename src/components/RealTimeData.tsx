'use client'

import { useEffect, useState } from 'react'
import { Cloud, Droplets, Wind } from 'lucide-react'

export default function RealTimeData() {
  const [data, setData] = useState({
    temperature: 24,
    humidity: 65,
    windSpeed: 8,
    uvIndex: 7,
    shadowCoverage: 35,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        temperature: prev.temperature + (Math.random() - 0.5) * 2,
        humidity: Math.max(30, Math.min(90, prev.humidity + (Math.random() - 0.5) * 4)),
        windSpeed: Math.max(0, prev.windSpeed + (Math.random() - 0.5) * 1),
        uvIndex: Math.max(0, Math.min(11, prev.uvIndex + (Math.random() - 0.5) * 0.5)),
        shadowCoverage: Math.max(0, Math.min(100, prev.shadowCoverage + (Math.random() - 0.5) * 5)),
      }))
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute bottom-6 right-6 bg-gray-900/95 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4 w-80 shadow-2xl">
      <h4 className="font-semibold text-yellow-400 mb-4 text-sm">Real-time Environment</h4>

      <div className="space-y-3">
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

        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
          <span className="text-gray-300 text-sm">Shadow Coverage</span>
          <span className="text-green-300 font-mono font-semibold">{data.shadowCoverage.toFixed(0)}%</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">Updates every 10 seconds</p>
      </div>
    </div>
  )
}
