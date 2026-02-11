'use client'

import { useEffect, useState } from 'react'
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
import { CITY_COORDS } from '@/lib/cityData'

type DailyPoint = { time: string; comfort: number; shadow: number; temp: number }
type CityAveragePoint = { time: string; radiance: number; shadowAvg: number }
type WeeklyPoint = { day: string; comfort: number; cycling: number }

type ChartState = {
  daily: DailyPoint[]
  cityAverages: CityAveragePoint[]
  weekly: WeeklyPoint[]
  metrics: { avgShadow: string; avgTemp: string; avgRadiance: string }
}

const EMPTY_STATE: ChartState = {
  daily: [],
  cityAverages: [],
  weekly: [],
  metrics: { avgShadow: '--', avgTemp: '--', avgRadiance: '--' },
}

interface DataPanelProps {
  location: { lat: number; lng: number; name: string } | null
  selectedCity?: string
  setSelectedCity?: (c: string) => void
}

export default function DataPanel({ location, selectedCity = 'New York', setSelectedCity }: DataPanelProps) {
  const [charts, setCharts] = useState<ChartState>(EMPTY_STATE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const coords = CITY_COORDS[selectedCity] || CITY_COORDS['New York']
    const controller = new AbortController()

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          latitude: String(coords.lat),
          longitude: String(coords.lng),
          timezone: 'auto',
          current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index',
          hourly: 'temperature_2m,relative_humidity_2m,uv_index,shortwave_radiation,wind_speed_10m',
          daily: 'temperature_2m_max,temperature_2m_min,shortwave_radiation_sum,uv_index_max',
        })

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch weather data')
        }

        const data = await response.json()
        const hourly = data.hourly || {}
        const daily = data.daily || {}

        const times: string[] = hourly.time || []
        const temps: number[] = hourly.temperature_2m || []
        const humidity: number[] = hourly.relative_humidity_2m || []
        const uvIndex: number[] = hourly.uv_index || []
        const shortwave: number[] = hourly.shortwave_radiation || []
        const wind: number[] = hourly.wind_speed_10m || []

        const daySlice = times.slice(0, 24)
        const dailyPoints: DailyPoint[] = []
        const cityPoints: CityAveragePoint[] = []

        const radiationToPercent = (value: number) => Math.min(100, Math.max(0, Math.round((value / 1000) * 100)))
        const comfortScore = (t: number, h: number, u: number, w: number) => {
          const tempPenalty = Math.abs(t - 22) * 2
          const humidityPenalty = Math.max(0, h - 50) * 0.2
          const uvPenalty = u * 2
          const windPenalty = w * 1.5
          const score = 100 - tempPenalty - humidityPenalty - uvPenalty - windPenalty
          return Math.min(100, Math.max(0, Math.round(score)))
        }

        daySlice.forEach((time, index) => {
          if (index % 2 === 0) {
            const radiance = radiationToPercent(shortwave[index] ?? 0)
            cityPoints.push({
              time: formatHourLabel(time),
              radiance,
              shadowAvg: 100 - radiance,
            })
          }

          if (index % 4 === 0) {
            const radiance = radiationToPercent(shortwave[index] ?? 0)
            dailyPoints.push({
              time: formatHourLabel(time),
              comfort: comfortScore(temps[index] ?? 0, humidity[index] ?? 0, uvIndex[index] ?? 0, wind[index] ?? 0),
              shadow: 100 - radiance,
              temp: Math.round((temps[index] ?? 0) * 10) / 10,
            })
          }
        })

        const average = (values: number[]) => {
          if (!values.length) return 0
          return values.reduce((sum, value) => sum + value, 0) / values.length
        }

        const radianceValues = daySlice.map((_, index) => radiationToPercent(shortwave[index] ?? 0))
        const avgTemp = average(daySlice.map((_, index) => temps[index] ?? 0))
        const avgRadiance = average(radianceValues)
        const avgShadow = 100 - avgRadiance

        const dailyTimes: string[] = daily.time || []
        const tempMax: number[] = daily.temperature_2m_max || []
        const tempMin: number[] = daily.temperature_2m_min || []
        const uvMax: number[] = daily.uv_index_max || []
        const radiationSum: number[] = daily.shortwave_radiation_sum || []

        const weekly: WeeklyPoint[] = dailyTimes.slice(0, 7).map((day, index) => {
          const avgDayTemp = ((tempMax[index] ?? 0) + (tempMin[index] ?? 0)) / 2
          const dayRadiance = Math.min(100, Math.max(0, Math.round(((radiationSum[index] ?? 0) / 24000) * 100)))
          const comfort = comfortScore(avgDayTemp, 55, uvMax[index] ?? 0, 4)
          const cycling = Math.min(100, Math.max(0, Math.round(comfort * 0.9 + dayRadiance * 0.1)))

          return {
            day: formatDayLabel(day),
            comfort,
            cycling,
          }
        })

        setCharts({
          daily: dailyPoints,
          cityAverages: cityPoints,
          weekly,
          metrics: {
            avgShadow: `${Math.round(avgShadow)}%`,
            avgTemp: `${Math.round(avgTemp * 10) / 10} C`,
            avgRadiance: `${Math.round(avgRadiance)}%`,
          },
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Live weather data unavailable')
          setCharts(EMPTY_STATE)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    return () => controller.abort()
  }, [selectedCity])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-yellow-400">City Analysis</h2>
        </div>
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl px-3 py-2">
          <label className="block text-[10px] text-gray-400 mb-1">City</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity && setSelectedCity(e.target.value)}
            className="bg-transparent text-xs text-gray-200 outline-none"
          >
            {Object.keys(CITY_COORDS).map((c) => (
              <option key={c} value={c} className="text-black">
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Comfort Analysis */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 shadow-lg">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Daily Comfort Index</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.daily}>
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
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#F87171"
                dot={{ fill: '#F87171', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* City-wide Radiance vs Shadow */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300 shadow-lg">
          <h3 className="text-lg font-semibold text-blue-300 mb-4">City Lighting and Shadow Coverage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.cityAverages}>
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
                dataKey="radiance"
                name="Avg Radiance"
                stroke="#38BDF8"
                dot={{ fill: '#38BDF8', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="shadowAvg"
                name="Avg Shadow"
                stroke="#A78BFA"
                dot={{ fill: '#A78BFA', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-500/50 transition-all duration-300 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-400">7-Day Comfort</h3>
          {isLoading && <span className="text-xs text-gray-400">Updating...</span>}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={charts.weekly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9CA3AF" />
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
        <MetricCard title="Avg Shadow Coverage" value={charts.metrics.avgShadow} trend="down" />
        <MetricCard title="Avg City Radiance" value={charts.metrics.avgRadiance} trend="up" />
        <MetricCard title="Avg Temperature" value={charts.metrics.avgTemp} trend="neutral" />
      </div>
    </div>
  )
}

function formatHourLabel(value: string) {
  const time = new Date(value)
  const hours = String(time.getHours()).padStart(2, '0')
  return `${hours}:00`
}

function formatDayLabel(value: string) {
  return new Date(value).toLocaleDateString('en-US', { weekday: 'short' })
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
