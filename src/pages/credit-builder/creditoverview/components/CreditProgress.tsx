import React, { useEffect } from 'react'
import { useCreditProgress } from '../../../../modules/credit-builder/overview'
import CreditProgressLoader from '../../../../components/Loader/CreditProgressLoader'

export default function CreditProgress() {
  const { data, isLoading, isError } = useCreditProgress()

  useEffect(() => {
    const bootstrapLib = (window as unknown as { bootstrap?: any }).bootstrap
    const els = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    if (bootstrapLib && els.length) {
      els.forEach((el) => {
        try { new bootstrapLib.Tooltip(el) } catch { }
      })
    }
  })

  if (isLoading) {
    return <CreditProgressLoader />
  }

  if (isError || !data) {
    return (
      <div className="card mb-3">
        <div className="card-body text-center text-muted py-5">
          <i className="ri-error-warning-line fs-1"></i>
          <p className="mt-2">Failed to load progress data</p>
        </div>
      </div>
    )
  }

  const currentTierIndex = data.tiers.findIndex(tier => tier.id === data.id)
  const totalTiers = data.tiers.length
  // The same overall progress the Step-By-Step Guide shows (BUG-024); the
  // current tier's own figures are shown below, labelled as the tier's.
  const overallProgress = data.total_complete_percentage

  return (
    <div className="card mb-3 credit-progress">
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-0 fs-15">Your Credit Building Progress</h6>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-dark text-white">{data.name}</span>
          <span className="badge bg-success-subtle text-success">{overallProgress}% Overall</span>
        </div>
      </div>
      <div className="card-body">
        {/* Progress Bar */}
        <div className="progress progress-goldnavy" style={{ height: 16, position: 'relative' }}>
          <div
            className="progress-bar progress-animated"
            role="progressbar"
            aria-label="Overall progress"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ width: `${overallProgress}%` }}
          ></div>

          {/* Tier indicators on progress bar (skip first tier) */}
          {data.tiers.slice(1).map((tier, index) => {
            const actualIndex = index + 1
            const position = (actualIndex / totalTiers) * 100
            const isPastTier = actualIndex < currentTierIndex
            const isCurrentTier = tier.id === data.id

            const indicatorClass = isPastTier
              ? 'tier-indicator tier-indicator--completed'
              : isCurrentTier
                ? 'tier-indicator tier-indicator--current'
                : 'tier-indicator tier-indicator--future'

            return (
              <div
                key={tier.id}
                className={indicatorClass}
                style={{ left: `${position}%` }}
              />
            )
          })}
        </div>

        {/* Tier Labels */}
        <div className="d-flex justify-content-between mt-3">
          {data.tiers.map((tier, index) => {
            const isCurrentTier = tier.id === data.id
            const isPastTier = index < currentTierIndex

            const iconClass = isPastTier
              ? 'tier-icon tier-icon--completed'
              : isCurrentTier
                ? 'tier-icon tier-icon--current'
                : 'tier-icon tier-icon--future'

            const labelClass = `tier-label ${isCurrentTier ? 'fw-bold' : ''} ${isPastTier ? 'tier-label--completed' : isCurrentTier ? 'tier-label--current' : 'tier-label--future'
              }`

            return (
              <div key={tier.id} className="tier-label-wrapper text-center">
                <div className={`${iconClass} d-inline-flex align-items-center justify-content-center mb-1`}>
                  {isPastTier ? (
                    <i className="ri-check-line icon-completed"></i>
                  ) : isCurrentTier ? (
                    <i className="ri-focus-3-line icon-current"></i>
                  ) : (
                    <i className="ri-lock-line icon-future"></i>
                  )}
                </div>
                <div className={labelClass}>
                  {tier.name}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4">
          <h6 className="mb-1 fs-14">
            {data.name} - {data.title}{' '}
            <span
              className="ms-1"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              data-bs-html="true"
              data-bs-custom-class="tooltip-info"
              title={`<strong>Why it matters:</strong> ${data.subtitle}`}
            >
              <i
                className="ri-information-fill align-middle text-warning"
                style={{ backgroundColor: 'rgba(46,116,249,.12)', borderRadius: '50%', padding: 4 }}
              ></i>
            </span>
          </h6>
          <p className="text-muted mb-0">{data.subtitle}</p>
        </div>
        <div className="d-flex justify-content-start gap-5 text-muted mt-2">
          <small>{data.name} progress: {data.current_tier_complete_percentage}%</small>
          <small>Estimated completion: {data.current_tier_estimated_completion_days} Days</small>
          <small>Tasks completed in this tier: {data.current_tier_complete_task}/{data.current_tier_complete_task + data.current_tier_tasks_remaining}</small>
        </div>
      </div>
    </div>
  )
}
