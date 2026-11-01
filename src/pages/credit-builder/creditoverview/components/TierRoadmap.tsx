import React from 'react'
import type { CreditProgressTier } from '../../../../modules/credit-builder/overview/types'

type StepState = 'done' | 'current' | 'locked'

const STATE: Record<StepState, { label: string; icon: string }> = {
  done: { label: 'Completed', icon: 'ri-check-line' },
  current: { label: 'In progress', icon: 'ri-focus-3-line' },
  locked: { label: 'Locked', icon: 'ri-lock-line' },
}

/**
 * Every tier as a step: the ones behind the borrower done, theirs in
 * progress, the rest locked. The track between the steps fills up to the
 * current tier.
 */
export default function TierRoadmap({ tiers, currentTierId }: { tiers: CreditProgressTier[]; currentTierId: number }) {
  const currentIndex = Math.max(0, tiers.findIndex((tier) => tier.id === currentTierId))
  const fill = tiers.length > 1 ? (currentIndex / (tiers.length - 1)) * 100 : 100

  return (
    <div className="co-card co-roadmap">
      <div className="co-card-head">
        <div>
          <h2 className="co-card-title">Your tier roadmap</h2>
          <p className="co-card-sub">Each tier unlocks the next as you complete its tasks</p>
        </div>
        {/* Tiers are numbered from 0, so the position reads as a step. */}
        <span className="co-chip">
          Step {currentIndex + 1} of {tiers.length}
        </span>
      </div>

      <div className="co-roadmap-track-wrap">
        <div className="co-roadmap-track" aria-hidden="true">
          <span className="co-roadmap-track-fill" style={{ width: `${fill}%` }}></span>
        </div>
        <ol className="co-roadmap-steps" aria-label="Tier roadmap">
          {tiers.map((tier, index) => {
            const state: StepState = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'locked'

            return (
              <li key={tier.id} className={`co-step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                <span className="co-step-dot" aria-hidden="true">
                  <i className={STATE[state].icon}></i>
                </span>
                <span className="co-step-name">{tier.name}</span>
                {tier.title && <span className="co-step-title">{tier.title}</span>}
                <span className="co-step-state">{STATE[state].label}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
