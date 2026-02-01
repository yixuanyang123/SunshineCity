'use client'

import { Sun, User, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  selectedCity?: string
  setSelectedCity?: (c: string) => void
}

const CITY_OPTIONS = ['Manhattan', 'Los Angeles', 'Boston', 'Miami', 'San Diego']

export default function Header({ selectedCity = 'Manhattan', setSelectedCity }: HeaderProps) {
  const [accountOpen, setAccountOpen] = useState(false)

  return (
    <header className="bg-gradient-to-r from-dark via-secondary to-dark border-b border-yellow-500/20 px-8 py-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-transparent rounded-lg overflow-hidden">
            <img src="/logo.png" alt="AEXUS" className="w-20 h-20 object-cover" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Sunshine City
            </h1>
            <p className="text-xs text-gray-400">Urban Comfort Analysis Platform · By AEXUS</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* City selector */}
          <div className="bg-gray-800 p-2 rounded-lg border border-gray-700">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity && setSelectedCity(e.target.value)}
              className="bg-transparent text-sm text-gray-200 outline-none"
            >
              {CITY_OPTIONS.map((c) => (
                <option key={c} value={c} className="text-black">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Account menu */}
          <div className="relative">
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg border border-gray-700"
            >
              <User className="w-4 h-4 text-gray-300" />
              <span className="text-sm text-gray-200">Account</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {accountOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-2">
                <button className="w-full text-left px-2 py-1 text-sm text-gray-200 hover:bg-gray-800 rounded">Profile</button>
                <button className="w-full text-left px-2 py-1 text-sm text-gray-200 hover:bg-gray-800 rounded">Settings</button>
                <button className="w-full text-left px-2 py-1 text-sm text-gray-200 hover:bg-gray-800 rounded">Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
