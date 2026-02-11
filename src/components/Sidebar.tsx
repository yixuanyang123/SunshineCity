'use client'

import { Map, BarChart3, Box, Settings } from 'lucide-react'
import React from 'react'

interface SidebarProps {
  activeTab: 'map' | 'analysis' | '3d'
  setActiveTab: (tab: 'map' | 'analysis' | '3d') => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: 'map', icon: Map, label: 'Map', color: 'text-blue-400' },
    { id: '3d', icon: Box, label: '3D Model', color: 'text-purple-400' },
    { id: 'analysis', icon: BarChart3, label: 'Analysis', color: 'text-green-400' },
  ]

  return (
    <aside className="w-20 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-6 gap-6">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'map' | 'analysis' | '3d')}
            className={`p-3 rounded-lg transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            title={tab.label}
          >
            <Icon className={`w-6 h-6 ${activeTab === tab.id ? 'text-dark' : tab.color}`} />
          </button>
        )
      })}

      <div className="flex-1"></div>

      <button className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-all duration-300">
        <Settings className="w-6 h-6" />
      </button>
    </aside>
  )
}
