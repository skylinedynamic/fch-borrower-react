import React from 'react'
import { Link } from 'react-router-dom'
import type { CreditProgressData } from '../../../../modules/credit-builder/overview/types'
import ProgressRing from './ProgressRing'

/** More pips than this and a count reads better as a number alone. */
const MAX_PIPS = 12

/**
 * The tier the borrower is on: why it matters and three figures - its own
 * progress, its tasks done out of the tasks it needs (all of Tier 0, one from
 * Tier 1 on - BUG-024), and how long the longest open task takes.
 */
export default function CurrentTierCard({ progress, isLastTier }: { progress: CreditProgressData; isLastTier: boolean }) {
  const done = progress.current_tier_complete_task
  const needed = done + progress.current_tier_tasks_remaining
  const isComplete = progress.current_tier_tasks_remaining === 0
  const days = progress.current_tier_estimated_completion_days

  // A task still to do but none listed yet (it arrives from the tier below)
  // has no estimate.
  const estimate = isComplete
    ? isLastTier ? 'All tiers complete' : 'Tier complete'
    : days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : '—'

  return (
    <div className="co-card co-focus">
      <div className="co-card-head">
        <div className="min-w-0">
          <span className="co-focus-eyebrow">Current tier</span>
          <h2 className="co-card-title">
            {progress.name} · {progress.title}
          </h2>
          {progress.subtitle && (
            <p className="co-focus-why">
              <i className="ri-lightbulb-flash-line" aria-hidden="true"></i>
              <span>
                <strong>Why it matters:</strong> {progress.subtitle}
              </span>
            </p>
          )}
        </div>
        <Link to="/credit-builder/guide" className="co-btn co-btn-primary">
          {isComplete ? 'Review in the guide' : 'Continue in the guide'} <i className="ri-arrow-right-line" aria-hidden="true"></i>
        </Link>
      </div>

      <div className="co-metrics">
        <div className="co-metric" role="group" aria-label={`${progress.name} progress`}>
          <ProgressRing value={progress.current_tier_complete_percentage} label={`${progress.name} progress`} size={64} stroke={7} className="co-metric-ring">
            <i className={isComplete ? 'ri-check-line' : 'ri-flag-2-line'} aria-hidden="true"></i>
          </ProgressRing>
          <div className="min-w-0">
            <div className="co-metric-value">{progress.current_tier_complete_percentage}%</div>
            <div className="co-metric-label">{progress.name} progress</div>
          </div>
        </div>

        <div className="co-metric" role="group" aria-label="Tasks completed in this tier">
          <span className="co-metric-icon tone-info" aria-hidden="true">
            <i className="ri-checkbox-multiple-line"></i>
          </span>
          <div className="min-w-0">
            <div className="co-metric-value">
              {done}/{needed}
            </div>
            <div className="co-metric-label">Tasks completed in this tier</div>
            {needed > 0 && needed <= MAX_PIPS && (
              <div className="co-pips" aria-hidden="true">
                {Array.from({ length: needed }, (_, i) => (
                  <span key={i} className={`co-pip ${i < done ? 'is-on' : ''}`}></span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="co-metric" role="group" aria-label="Estimated completion">
          <span className={`co-metric-icon ${isComplete ? 'tone-success' : 'tone-warning'}`} aria-hidden="true">
            <i className={isComplete ? 'ri-medal-line' : 'ri-time-line'}></i>
          </span>
          <div className="min-w-0">
            <div className="co-metric-value">{estimate}</div>
            <div className="co-metric-label">Estimated completion</div>
          </div>
        </div>
      </div>
    </div>
  )
}
