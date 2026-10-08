import React from 'react'
import { Link } from 'react-router-dom'
import { useProfileCompletion } from '../../modules/profile'
import { buildUnlockRequirements } from './unlockRequirements'

const STATE_ICON = {
  done: 'ri-checkbox-circle-fill',
  current: 'ri-time-line',
  upcoming: 'ri-checkbox-blank-circle-line',
} as const

const STATE_LABEL = { done: 'Done', current: 'Next', upcoming: 'To do' } as const

export default function CapitalAccessLocked() {
  // What is left comes from the Getting Started status; if it can't be loaded
  // the list simply shows everything still to do.
  const { data: completion } = useProfileCompletion()
  const requirements = buildUnlockRequirements(completion)

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="ca-page-wrap">
          <div className="row pb-1 mb-3">
            <div className="col-12">
              <div className="text-center py-2 w-100">
                <h4 className="fs-22 mb-1 fw-bold text-dark">Credit Card Stacking</h4>
                <p className="ca-page-subtitle">
                  Discover and execute structured funding plays to maximize your business credit limit.
                </p>
              </div>
            </div>
          </div>

          <div className="ca-locked-container">
            <div className="card ca-locked-card">
              <div className="card-body ca-locked-card-body">
                <div className="ca-locked-badge">
                  <i className="ri-lock-2-line"></i>
                  <span>Access Restricted</span>
                </div>
                <div className="ca-locked-icon-wrapper">
                  <i className="ri-shield-keyhole-line ca-locked-icon"></i>
                </div>
                <h3 className="ca-locked-title">Unlock Your Credit Card Stacking Readiness</h3>
                <p className="ca-locked-description">
                  To view your personalized <strong>Credit Card Stacking Readiness Scores</strong>, explore <strong>Estimated Total Access</strong>, and execute strategic funding plays, your business credit profile needs to be verified and finalized.
                </p>
                <div className="ca-locked-action-box">
                  <div className="ca-locked-action-icon">
                    <i className="ri-information-line"></i>
                  </div>
                  <p className="ca-locked-action-text">
                    Verification in progress? Please contact your <span className="ca-locked-action-highlight">Account Manager</span> to complete your credit report update.
                  </p>
                </div>
                <section className="ca-unlock" aria-labelledby="ca-unlock-title">
                  <h4 id="ca-unlock-title" className="ca-unlock-title">Why is this still locked?</h4>
                  <p className="ca-unlock-intro">
                    It opens once your credit profile and Tier 0 are verified. Here is where you stand.
                  </p>
                  <ol className="ca-unlock-list">
                    {requirements.map((requirement) => (
                      <li
                        key={requirement.id}
                        className={`ca-unlock-item is-${requirement.state}`}
                        aria-current={requirement.state === 'current' ? 'step' : undefined}
                      >
                        <span className="ca-unlock-icon" aria-hidden="true">
                          <i className={STATE_ICON[requirement.state]}></i>
                        </span>
                        <div className="ca-unlock-body">
                          <div className="ca-unlock-item-title">
                            {requirement.title}
                            <span className="ca-unlock-state">{STATE_LABEL[requirement.state]}</span>
                          </div>
                          <div className="ca-unlock-item-text">{requirement.text}</div>
                        </div>
                        {requirement.action && (
                          <Link to={requirement.action.route} className="ca-unlock-action">
                            {requirement.action.label} <i className="ri-arrow-right-line" aria-hidden="true"></i>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
