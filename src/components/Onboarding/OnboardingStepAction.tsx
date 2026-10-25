import React from 'react'
import { Link } from 'react-router-dom'
import type { OnboardingStepConfig } from '../../modules/onboarding'

interface OnboardingStepActionProps {
  step: OnboardingStepConfig
  onNavigate?: () => void
}

/** The call to action for a step: a link to where it's done, or a "waiting" badge. */
export default function OnboardingStepAction({ step, onNavigate }: OnboardingStepActionProps) {
  if (step.kind === 'wait') {
    return (
      <span className="onb-badge-wait">
        <i className="ri-time-line" aria-hidden="true"></i>In review
      </span>
    )
  }
  if (!step.route || !step.ctaLabel) return null
  return (
    // The destination page can tell the walkthrough brought the borrower (see FundingArrivalNote).
    <Link to={step.route} state={{ fromWalkthrough: true }} className="onb-btn onb-btn-primary" onClick={onNavigate}>
      {step.ctaLabel} <i className="ri-arrow-right-line" aria-hidden="true"></i>
    </Link>
  )
}
