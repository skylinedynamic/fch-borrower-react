import React from 'react'
import { Link } from 'react-router-dom'

/** The catalogue below the tier that unlocks it. */
export function CreditAccountsLocked() {
  return (
    <div className="ca-state ca-state-locked">
      <span className="ca-state-icon" aria-hidden="true"><i className="ri-lock-password-line"></i></span>
      <h2 className="ca-state-title">Credit accounts are locked</h2>
      <p className="ca-state-text">
        To unlock credit account applications, first complete the Foundation (Tier 0) requirements.
        The Credit Builder guide tracks your progress.
      </p>
      <Link to="/credit-builder/guide" className="ca-btn ca-btn-primary">
        <i className="ri-book-open-line" aria-hidden="true"></i> Go to the Guide
      </Link>
    </div>
  )
}

/** Nothing matches the filters. */
export function CreditAccountsEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className="ca-state">
      <span className="ca-state-icon" aria-hidden="true"><i className="ri-search-eye-line"></i></span>
      <h2 className="ca-state-title">No matching accounts</h2>
      <p className="ca-state-text">
        No credit accounts match your search or eligibility. Clearing the filters may show more options.
      </p>
      <button type="button" className="ca-btn ca-btn-primary" onClick={onClear}>
        <i className="ri-restart-line" aria-hidden="true"></i> Clear filters
      </button>
    </div>
  )
}

/** Cards in the shape of the real ones while the list loads. */
export function CreditAccountsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="ca-grid" aria-hidden="true" data-testid="ca-skeleton">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ca-card ca-card-skeleton">
          <div className="ca-card-visual"><span className="ca-sk ca-sk-logo"></span></div>
          <div className="ca-card-body">
            <span className="ca-sk ca-sk-line ca-sk-short"></span>
            <span className="ca-sk ca-sk-line"></span>
            <div className="ca-metrics">
              <span className="ca-sk ca-sk-tile"></span>
              <span className="ca-sk ca-sk-tile"></span>
            </div>
            <span className="ca-sk ca-sk-line"></span>
            <span className="ca-sk ca-sk-line"></span>
            <span className="ca-sk ca-sk-btn"></span>
          </div>
        </div>
      ))}
    </div>
  )
}
