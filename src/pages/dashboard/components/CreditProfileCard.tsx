import React from 'react'
import type { Tier } from '../../../modules/dashboard/types'
import type { FicoDisplay } from '../dashboardMappers'

// A half circle from 9 o'clock to 3 o'clock, radius 80.
const ARC = 'M 20 100 A 80 80 0 0 1 180 100'
const ARC_LENGTH = Math.PI * 80

interface CreditProfileCardProps {
  fico: FicoDisplay
  tier: Tier | null | undefined
}

/** Credit score (300-850 gauge) and current Credit Builder tier, side by side. */
export default function CreditProfileCard({ fico, tier }: CreditProfileCardProps) {
  const { hasScore, score, fraction } = fico

  return (
    <section className="db-card db-profile" aria-label="Credit profile">
      <div className="db-profile-half" data-widget="credit-score">
        <div className="db-section-label">
          <span className="db-card-icon tone-success" aria-hidden="true">
            <i className="ri-shield-star-line"></i>
          </span>
          <h2 className="db-card-title">Credit Score</h2>
        </div>

        <div className={`db-gauge ${hasScore ? '' : 'is-empty'}`}>
          <svg viewBox="0 0 200 112" aria-hidden="true">
            <defs>
              <linearGradient id="db-gauge-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f06548" />
                <stop offset="50%" stopColor="#f7b84b" />
                <stop offset="100%" stopColor="#0ab39c" />
              </linearGradient>
            </defs>
            <path d={ARC} className="db-gauge-track" />
            {hasScore && (
              <path
                d={ARC}
                className="db-gauge-fill"
                strokeDasharray={ARC_LENGTH}
                strokeDashoffset={ARC_LENGTH * (1 - fraction)}
              />
            )}
          </svg>
          <div className="db-gauge-center">
            <span className="db-gauge-value">{hasScore ? score : '---'}</span>
            <span className="db-gauge-label">{hasScore ? 'FICO' : 'N/A'}</span>
          </div>
          <div className="db-gauge-scale" aria-hidden="true">
            <span>300</span>
            <span>850</span>
          </div>
        </div>
        <p className="db-profile-note">
          {hasScore
            ? `Your current credit score is ${score}. Keep building your credit profile to unlock better financing options.`
            : "You haven't started credit scoring yet. Build your credit profile to unlock better financing options."}
        </p>
      </div>

      <div className="db-profile-half db-profile-tier" data-widget="tier">
        <div className="db-section-label">
          <span className="db-card-icon tone-warning" aria-hidden="true">
            <i className="ri-vip-crown-2-line"></i>
          </span>
          <h2 className="db-card-title">Current Tier Status</h2>
        </div>

        <div className="db-profile-tier-body">
          <div className="db-tier">
            <div className="min-w-0">
              <div className="db-tier-name">{tier?.name || 'N/A'}</div>
              <div className="db-muted">{tier?.title || 'N/A'}</div>
            </div>
          </div>

          <div className="db-stat" data-stat>
            <span className="db-stat-label">
              <i className="ri-task-line" aria-hidden="true"></i>
              Tasks Under Review
            </span>
            <span className="db-stat-value">{tier?.tasks_under_review || 0}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
