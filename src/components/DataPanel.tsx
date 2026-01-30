'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const mockData = [
  { time: '00:00', comfort: 35, shadow: 95, temp: 15 },
  { time: '04:00', comfort: 30, shadow: 90, temp: 12 },
  { time: '08:00', comfort: 55, shadow: 40, temp: 18 },
  { time: '12:00', comfort: 85, shadow: 10, temp: 28 },
  { time: '16:00', comfort: 90, shadow: 15, temp: 26 },
  { time: '20:00', comfort: 60, shadow: 50, temp: 20 },
  { time: '24:00', comfort: 40, shadow: 85, temp: 16 },
]

const monthlyData = [
  { month: 'Jan', comfort: 45, cycling: 38 },
  { month: 'Feb', comfort: 48, cycling: 40 },
  { month: 'Mar', comfort: 65, cycling: 58 },
  { month: 'Apr', comfort: 78, cycling: 72 },
  { month: 'May', comfort: 85, cycling: 80 },
  { month: 'Jun', comfort: 88, cycling: 83 },
  { month: 'Jul', comfort: 90, cycling: 85 },
  { month: 'Aug', comfort: 89, cycling: 84 },
  { month: 'Sep', comfort: 82, cycling: 76 },
  { month: 'Oct', comfort: 70, cycling: 64 },
  { month: 'Nov', comfort: 55, cycling: 48 },
  { month: 'Dec', comfort: 45, cycling: 38 },
]

interface DataPanelProps {
  location: { lat: number; lng: number; name: string } | null
}

export default function DataPanel({ location }: DataPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Comfort Analysis */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 shadow-lg">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Daily Comfort Index</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend wrapperStyle={{ color: '#D1D5DB' }} />
              <Line
                type="monotone"
                dataKey="comfort"
                stroke="#FBBF24"
                dot={{ fill: '#F59E0B', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="shadow"
                stroke="#60A5FA"
                dot={{ fill: '#3B82F6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-500/50 transition-all duration-300 shadow-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-4">Year-round Comfort</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend wrapperStyle={{ color: '#D1D5DB' }} />
              <Bar dataKey="comfort" fill="#34D399" radius={[8, 8, 0, 0]} />
              <Bar dataKey="cycling" fill="#60A5FA" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Location Details */}
      {location && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-6 border border-yellow-500/30 shadow-lg">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Location Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Latitude</p>
              <p className="text-yellow-300 font-mono text-lg">{location.lat.toFixed(4)}</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Longitude</p>
              <p className="text-yellow-300 font-mono text-lg">{location.lng.toFixed(4)}</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Location</p>
              <p className="text-yellow-300 text-lg">{location.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Avg Shadow Coverage" value="42%" trend="down" />
        <MetricCard title="Pedestrian Comfort" value="76%" trend="up" />
        <MetricCard title="Cycling Routes" value="18" trend="neutral" />
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  trend,
}: {
  title: string
  value: string
  trend: 'up' | 'down' | 'neutral'
}) {
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-blue-400' : 'text-gray-400'

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-yellow-500/50 transition-all duration-300">
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <p className="text-2xl font-bold text-yellow-400">{value}</p>
      <p className={`text-xs mt-2 ${trendColor}`}>
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} Trend
      </p>
    </div>
  )
}
