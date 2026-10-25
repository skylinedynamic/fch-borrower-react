import React from 'react'

interface DashboardHeroProps {
  name?: string
  score: number
  status: string
  totalAccess: string
  hasActivePlay: boolean
  /** Opens the strategy; left out (no button) until the borrower has paid. */
  onOpenCapitalAccess?: () => void
}

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const today = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

/**
 * The top of the dashboard: the greeting, and Capital Access - the borrower's
 * readiness score, estimated access and the way into their strategy.
 */
export default function DashboardHero({
  name,
  score,
  status,
  totalAccess,
  hasActivePlay,
  onOpenCapitalAccess,
}: DashboardHeroProps) {
  const clamped = Math.min(Math.max(score, 0), 100)

  return (
    <section className="db-hero" data-widget="capital-access" aria-labelledby="db-hero-title">
      <span className="db-hero-orb db-hero-orb-a" aria-hidden="true"></span>
      <span className="db-hero-orb db-hero-orb-b" aria-hidden="true"></span>

      <div className="db-hero-main">
        <p className="db-hero-date">
          <i className="ri-calendar-2-line" aria-hidden="true"></i> {today()}
        </p>
        <h1 id="db-hero-title" className="db-hero-title">
          Welcome back, {name}!
        </h1>
        <p className="db-hero-subtitle">Here's what's happening with your business.</p>

        <div className="db-hero-cta">
          <span className="db-hero-tag">
            <i className="ri-sparkling-2-fill" aria-hidden="true"></i>
            {hasActivePlay ? 'Active Strategy' : 'Get Started'}
          </span>
          <h2 className="db-hero-cta-title">
            {hasActivePlay ? 'Continue your funding journey' : 'Start your capital access strategy'}
          </h2>
          <p className="db-hero-cta-text">
            {hasActivePlay
              ? 'Pick up where you left off and keep building your business credit profile.'
              : 'Choose a play strategy tailored to your business funding goals and credit profile.'}
          </p>
          {onOpenCapitalAccess && (
            <button type="button" className="db-hero-btn" onClick={onOpenCapitalAccess}>
              {hasActivePlay ? 'Resume Strategy' : 'Choose Strategy'}
              <i className="ri-arrow-right-line" aria-hidden="true"></i>
            </button>
          )}
        </div>
      </div>

      <div className="db-hero-panel">
        <div className="db-hero-panel-head">
          <span className="db-hero-panel-icon" aria-hidden="true">
            <i className="ri-funds-line"></i>
          </span>
          <div>
            <div className="db-hero-panel-title">Credit Card Stacking</div>
            <div className="db-hero-panel-subtitle">Funding Readiness Overview</div>
          </div>
        </div>

        <div className="db-hero-panel-body">
          <div
            className="db-ring"
            role="meter"
            aria-label="Readiness score"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <linearGradient id="db-ring-gradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" className="db-ring-stop-a" />
                  <stop offset="100%" className="db-ring-stop-b" />
                </linearGradient>
              </defs>
              <circle className="db-ring-track" cx="60" cy="60" r={RADIUS} />
              <circle
                className="db-ring-fill"
                cx="60"
                cy="60"
                r={RADIUS}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)}
              />
            </svg>
            <div className="db-ring-center">
              <span className="db-ring-value">{score}</span>
              <span className="db-ring-label">of 100</span>
            </div>
          </div>

          <div className="db-hero-facts">
            <div>
              <div className="db-hero-fact-label">Readiness Status</div>
              <span className="db-hero-status">
                <i className="ri-checkbox-circle-fill" aria-hidden="true"></i>
                {status}
              </span>
            </div>
            <div>
              <div className="db-hero-fact-label">Total Est. Access</div>
              <div className="db-hero-access">{totalAccess}</div>
            </div>
          </div>
        </div>
        <p className="db-hero-note">Readiness index out of 100 based on your credit profile and business factors.</p>
      </div>
    </section>
  )
}
