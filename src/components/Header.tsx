'use client'

import { Sun } from 'lucide-react'

interface HeaderProps {}

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-dark via-secondary to-dark border-b border-yellow-500/20 px-8 py-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
            <Sun className="w-8 h-8 text-dark" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Sunshine City
            </h1>
            <p className="text-xs text-gray-400">Urban Comfort Analysis Platform</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-base font-semibold text-gray-300">Manhattan Routes Analysis</p>
        </div>
      </div>
    </header>
  )
}
