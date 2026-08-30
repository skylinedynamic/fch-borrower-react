import React from 'react'



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
  return (
    <div className="stats">
      <div className="stat">
        <div className="num">{currentTier}</div>
        <div className="label">Current Tier</div>
      </div>
      <div className="stat">
        <div className="num">{overallProgress}</div>
        <div className="label">Overall Progress</div>
      </div>
      <div className="stat">
        <div className="num">{estTimeToNext}</div>
        <div className="label">Est. Time to Next Tier</div>
      </div>
      <div className="stat">
        <div className="num">{tasksCompleted}</div>
        <div className="label">Tasks Completed</div>
      </div>
    </div>
  )
}
