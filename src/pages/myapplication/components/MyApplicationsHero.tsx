import React from 'react'
import { Link } from 'react-router-dom'

interface StatProps {
  label: string
  icon: string
  value?: number
}

function Stat({ label, icon, value }: StatProps) {
  return (
    <div className="ma-stat" role="group" aria-label={label}>
      <span className="ma-tile-head">
        <span className="ma-stat-icon" aria-hidden="true"><i className={icon}></i></span>
        <span className="ma-stat-label">{label}</span>
      </span>
      {value === undefined ? <span className="ma-stat-skeleton" aria-hidden="true"></span> : <span className="ma-stat-value">{value}</span>}
    </div>
  )
}

interface MyApplicationsHeroProps {
  /** Totals across every page; undefined while they load. */
  prequalTotal?: number
  fundingTotal?: number
}

/** The page's opening band: what it is for, the next step, and the totals. */
export default function MyApplicationsHero({ prequalTotal, fundingTotal }: MyApplicationsHeroProps) {
  return (
    <section className="ma-hero" aria-labelledby="ma-hero-title">
      <div className="min-w-0">
        <span className="ma-hero-eyebrow"><i className="ri-folder-chart-line" aria-hidden="true"></i> Funding journey</span>
        <h4 id="ma-hero-title" className="ma-hero-title">My Applications</h4>
        <p className="ma-hero-subtitle">Track your prequalification requests and funding applications, and see where each one stands.</p>
        <Link to="/pre-qualification" className="ma-hero-cta">
          <i className="ri-add-line" aria-hidden="true"></i>Apply New Prequalification
        </Link>
      </div>
      <div className="ma-stats">
        <Stat label="Prequalification requests" icon="ri-file-list-3-line" value={prequalTotal} />
        <Stat label="Funding applications" icon="ri-bank-line" value={fundingTotal} />
      </div>
    </section>
  )
}
