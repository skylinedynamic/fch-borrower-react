import React from 'react'
import { Link } from 'react-router-dom'

interface RecommendedNextStepProps {
  disabled?: boolean
  /** Locked: there is nothing to choose yet, so no button. */
  locked?: boolean
}

export default function RecommendedNextStep({ disabled = false, locked = false }: RecommendedNextStepProps) {
  return (
    <div className="ca-next-step-card">
      <div className="ca-next-step-content">
        <h6 className="ca-next-step-label" style={{ fontWeight: 600, color: '#343a40', fontSize: '16px', margin: 0, textTransform: 'none', letterSpacing: 'normal' }}>
          Recommended Next Step
        </h6>
        <p className="ca-next-step-desc" style={{ color: '#878a99', fontSize: '13px', fontWeight: 500, marginTop: '4px', marginBottom: 0 }}>
          {locked
            ? 'Your strategy options open once the requirement above is met.'
            : 'Select your Credit Card Stacking Strategy to begin.'}
        </p>
      </div>
      {locked ? null : disabled ? (
        <button
          className="ca-btn ca-btn-primary animate__animated animate__fadeIn"
          style={{ minWidth: '180px', cursor: 'not-allowed', opacity: 0.6 }}
          disabled
        >
          Choose Your Strategy <i className="ri-arrow-right-line"></i>
        </button>
      ) : (
        <Link
          to="/credit-card-stacking/strategy"
          className="ca-btn ca-btn-primary"
          style={{ minWidth: '180px' }}
        >
          Choose Your Strategy <i className="ri-arrow-right-line"></i>
        </Link>
      )}
    </div>
  )
}
