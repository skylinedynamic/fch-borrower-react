import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FUNDING_STAGES } from '../../../config/funding'
import type { FundingArrivalState } from '../../../config/funding'
import './FundingHowItWorks.css'

/**
 * "How funding works": the stages a funding request goes through, so the
 * borrower knows what follows before they start. Pre-qualification is offered
 * beside it as optional - it is never a step, before or after anything.
 */
export default function FundingHowItWorks() {
  return (
    <section className="funding-how card border mb-3" aria-labelledby="funding-how-title">
      <div className="card-body py-3">
        <div className="funding-how-head">
          <h6 id="funding-how-title" className="funding-how-title">
            How funding works
          </h6>
          <div className="funding-how-prequal">
            <span className="funding-how-optional">Optional</span>
            <Link to="/pre-qualification" className="btn btn-sm btn-outline-primary">
              See if you pre-qualify
            </Link>
          </div>
        </div>
        <ol className="funding-how-steps" aria-label="How funding works">
          {FUNDING_STAGES.map((stage, index) => (
            <li key={stage}>
              <span className="funding-how-index" aria-hidden="true">
                {index + 1}
              </span>
              <span>{stage}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/**
 * Shown to a borrower the Getting Started walkthrough just brought here (the
 * last step of the funding-only journey): they are where they need to be.
 */
export function FundingArrivalNote() {
  const location = useLocation()
  const state = location.state as FundingArrivalState | null
  if (!state?.fromWalkthrough) return null

  return (
    <div className="funding-arrival" role="status">
      <i className="ri-checkbox-circle-fill" aria-hidden="true"></i>
      <div>
        <strong>You're in the right place.</strong> Pick a program below to start a funding request.
      </div>
    </div>
  )
}
