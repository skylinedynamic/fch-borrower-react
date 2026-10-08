import React from 'react'

const STATS = [
  { key: 'tier', label: 'Current Tier', icon: 'ri-vip-crown-2-line', tone: 'indigo' },
  { key: 'progress', label: 'Overall Progress', icon: 'ri-line-chart-line', tone: 'success' },
  { key: 'time', label: 'Est. Time to Next Tier', icon: 'ri-time-line', tone: 'warning' },
  { key: 'tasks', label: 'Tasks Completed', icon: 'ri-checkbox-multiple-line', tone: 'info' },
] as const

export default function ProgressStats({
  currentTier = '1',
  overallProgress = '45%',
  estTimeToNext = '3–4 weeks',
  tasksCompleted = '4/37'
}: {
  currentTier?: string | number
  overallProgress?: string | number
  estTimeToNext?: string | number
  tasksCompleted?: string
}) {
  const values = [currentTier, overallProgress, estTimeToNext, tasksCompleted]

  return (
    <div className="cg-stats">
      {STATS.map((stat, i) => (
        <div className={`cg-stat tone-${stat.tone}`} key={stat.key} data-stat>
          <span className="cg-stat-icon" aria-hidden="true">
            <i className={stat.icon}></i>
          </span>
          <div className="min-w-0">
            <div className="cg-stat-num">{values[i]}</div>
            <div className="cg-stat-label">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** The same four cards while the numbers load. */
export function ProgressStatsSkeleton() {
  return (
    <div className="cg-stats" aria-hidden="true">
      {STATS.map((stat) => (
        <div className="cg-stat" key={stat.key}>
          <span className="cg-sk" style={{ width: 44, height: 44 }}></span>
          <div className="flex-grow-1">
            <span className="cg-sk d-block mb-2" style={{ width: '55%', height: 18 }}></span>
            <span className="cg-sk d-block" style={{ width: '75%', height: 12 }}></span>
          </div>
        </div>
      ))}
    </div>
  )
}
