import React from 'react'

interface StepNavigationProps {
  step: number
  onTabClick: (step: number) => void
  mobileOpenIdx: number | null
  renderStepSection: (idx: number) => React.ReactNode
}

export default function StepNavigation({ step, onTabClick, mobileOpenIdx, renderStepSection }: StepNavigationProps) {
  return (
    <ul className="tab-chevrons">
      <li>
        <button 
          type="button" 
          className={`tab-btn ${step===0?'active':''}`} 
          onClick={() => onTabClick(0)}
        >
          Personal Info
        </button>
        {mobileOpenIdx===0 && (
          <div className="p-3 d-block d-md-none">
            {renderStepSection(0)}
          </div>
        )}
      </li>
      <li>
        <button 
          type="button" 
          className={`tab-btn ${step===1?'active':''}`} 
          onClick={() => onTabClick(1)}
          disabled={step < 0}
          style={{ cursor: step < 0 ? 'not-allowed' : 'pointer' }}
        >
          Business Details
        </button>
        {mobileOpenIdx===1 && (
          <div className="p-3 d-block d-md-none">
            {renderStepSection(1)}
          </div>
        )}
      </li>
      <li>
        <button 
          type="button" 
          className={`tab-btn ${step===2?'active':''}`} 
          onClick={() => onTabClick(2)}
          disabled={step < 1}
          style={{ cursor: step < 1 ? 'not-allowed' : 'pointer' }}
        >
          Funding Needs
        </button>
        {mobileOpenIdx===2 && (
          <div className="p-3 d-block d-md-none">
            {renderStepSection(2)}
          </div>
        )}
      </li>
      <li>
        <button 
          type="button" 
          className={`tab-btn ${step===3?'active':''}`} 
          onClick={() => onTabClick(3)}
          disabled={step < 2}
          style={{ cursor: step < 2 ? 'not-allowed' : 'pointer' }}
        >
          Review
        </button>
        {mobileOpenIdx===3 && (
          <div className="p-3 d-block d-md-none">
            {renderStepSection(3)}
          </div>
        )}
      </li>
    </ul>
  )
}
