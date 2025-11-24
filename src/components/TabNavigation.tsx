import React from 'react'

interface TabNavigationProps {
  tabs: string[]
  activeTab: number
  onTabChange: (index: number) => void
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="card-header p-0">
      <ul className="tab-chevrons">
        {tabs.map((tab, index) => (
          <li key={index}>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === index ? 'active' : ''}`} 
              onClick={() => onTabChange(index)}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
