import React from 'react'
import { Link } from 'react-router-dom'
import { useProfileCompletion } from '../../modules/profile'
import { buildUnlockRequirements } from './unlockRequirements'
import './CapitalAccessLocked.css'

const STATE_ICON = {
  done: 'ri-check-line',
  current: 'ri-time-line',
  upcoming: 'ri-lock-line',
} as const

const STATE_LABEL = { done: 'Done', current: 'Next', upcoming: 'To do' } as const

const RING_RADIUS = 30
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/** The page head shared by the locked screen and its skeleton. */
export function CapitalAccessLockedHead() {
  return (
    <header className="cal-head">
      <h4 className="cal-page-title">Credit Card Stacking</h4>
      <p className="cal-page-subtitle">
        Discover and execute structured funding plays to maximize your business credit limit.
      </p>
    </header>
  )
}

export default function CapitalAccessLocked() {
  // What is left comes from the Getting Started status; if it can't be loaded
  // the list simply shows everything still to do.
  const { data: completion } = useProfileCompletion()
  const requirements = buildUnlockRequirements(completion)
  const done = requirements.filter((requirement) => requirement.state === 'done').length
  const total = requirements.length

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="cal-shell">
          <CapitalAccessLockedHead />

          <div className="cal-card">
            {/* ── What is locked, and how far along the borrower is ─────── */}
            <section className="cal-summary" aria-labelledby="cal-title">
              <span className="cal-lock" aria-hidden="true">
                <i className="ri-shield-keyhole-line"></i>
              </span>
              <div className="cal-summary-text">
                <span className="cal-badge">
                  <i className="ri-lock-2-line" aria-hidden="true"></i>
                  Access restricted
                </span>
                <h3 id="cal-title" className="cal-title">
                  Unlock Your Credit Card Stacking Readiness
                </h3>
                <p className="cal-text">
                  To view your personalized <strong>Credit Card Stacking Readiness Scores</strong>, explore{' '}
                  <strong>Estimated Remaining Access</strong>, and execute strategic funding plays, your credit profile
                  needs to be verified and your Tier 0 tasks completed.
                </p>
              </div>
              <div className="cal-progress">
                <div
                  className="cal-ring"
                  role="progressbar"
                  aria-label="Your progress"
                  aria-valuenow={done}
                  aria-valuemin={0}
                  aria-valuemax={total}
                >
                  <svg viewBox="0 0 72 72" aria-hidden="true">
                    <circle className="cal-ring-track" cx="36" cy="36" r={RING_RADIUS} />
                    <circle
                      className="cal-ring-fill"
                      cx="36"
                      cy="36"
                      r={RING_RADIUS}
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={RING_CIRCUMFERENCE * (1 - done / total)}
                    />
                  </svg>
                  <span className="cal-ring-text">
                    {done}/{total}
                  </span>
                </div>
                <span className="cal-progress-label">
                  {done} of {total} done
                </span>
              </div>
            </section>

            {/* ── Why it is still locked: what is done, and what is left ── */}
            <section className="cal-steps" aria-labelledby="cal-steps-title">
              <div className="cal-steps-head">
                <h4 id="cal-steps-title" className="cal-steps-title">
                  Why is this still locked?
                </h4>
                <p className="cal-steps-intro">
                  It opens once your credit profile and Tier 0 are verified. Here is where you stand.
                </p>
              </div>

              <ol className="cal-list">
                {requirements.map((requirement, index) => (
                  <li
                    key={requirement.id}
                    className={`cal-item is-${requirement.state}`}
                    aria-current={requirement.state === 'current' ? 'step' : undefined}
                  >
                    <div className="cal-item-top">
                      <span className="cal-marker" aria-hidden="true">
                        <i className={STATE_ICON[requirement.state]}></i>
                      </span>
                      <span className="cal-item-step" aria-hidden="true">
                        Step {index + 1}
                      </span>
                      <span className="cal-state">{STATE_LABEL[requirement.state]}</span>
                    </div>
                    <div className="cal-item-body">
                      <span className="cal-item-title">{requirement.title}</span>
                      <p className="cal-item-text">{requirement.text}</p>
                      {requirement.action && (
                        <Link to={requirement.action.route} className="cal-action">
                          {requirement.action.label} <i className="ri-arrow-right-line" aria-hidden="true"></i>
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <footer className="cal-help">
              <i className="ri-customer-service-2-line" aria-hidden="true"></i>
              <p>
                Verification in progress? Please contact your <strong>Account Manager</strong> to complete your credit
                report update.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
