import React from 'react'

interface StepNavigationProps {
  step: number
  onTabClick: (step: number) => void
  mobileOpenIdx: number | null
  renderStepSection: (idx: number) => React.ReactNode
  /** Underwriting only unlocks once the pre-qualification has been submitted. */
  isSubmitted?: boolean
  /** Whether a step's tab may be opened; steps are completed and saved in order. */
  canOpen?: (idx: number) => boolean
}

export default function StepNavigation({ step, onTabClick, mobileOpenIdx, renderStepSection, isSubmitted = false, canOpen = () => true }: StepNavigationProps) {
  return (
    <ul className="tab-chevrons">
      <li>
        <button
          type="button"
          className={`tab-btn ${step === 0 ? 'active' : ''}`}
          onClick={() => onTabClick(0)}
          disabled={!canOpen(0)}
        >
          Personal Info
        </button>
        {mobileOpenIdx === 0 && (
          <div className="p-3 d-block d-md-none">
            {renderStepSection(0)}
          </div>
        )}
      </li>
      <li>
        <button
          type="button"
          className={`tab-btn ${step === 1 ? 'active' : ''}`}
          onClick={() => onTabClick(1)}
          disabled={!canOpen(1)}
        >
          Business Details
        </button>
        {mobileOpenIdx === 1 && (
          <div className="p-3 d-block d-md-none">
            {renderStepSection(1)}
          </div>
        )}
      </li>
      <li>
        <button
          type="button"
          className={`tab-btn ${step === 2 ? 'active' : ''}`}
          onClick={() => onTabClick(2)}
          disabled={!canOpen(2)}
        >
          Funding Needs
        </button>
        {mobileOpenIdx === 2 && (
          <div className="p-3 d-block d-md-none">
            {renderStepSection(2)}
          </div>
        )}
      </li>
      <li>
        <button
          type="button"
          className={`tab-btn ${step === 3 ? 'active' : ''}`}
          onClick={() => onTabClick(3)}
          disabled={!canOpen(3)}
        >
          Review
        </button>
        {mobileOpenIdx === 3 && (
          <div className="d-block d-md-none">
            {renderStepSection(3)}
          </div>
        )}
      </li>
      <li>
        <button
          type="button"
          className={`tab-btn ${step === 4 ? 'active' : ''}`}
          onClick={() => onTabClick(4)}
          disabled={!isSubmitted || !canOpen(4)}
          title={isSubmitted ? undefined : 'Available after you submit your pre-qualification'}
        >
          {!isSubmitted && <i className="ri-lock-line me-1"></i>}
          Underwriting Result
        </button>
        {mobileOpenIdx === 4 && (
          <div className="d-block d-md-none">
            {renderStepSection(4)}
          </div>
        )}
      </li>
    </ul>
  )
}
