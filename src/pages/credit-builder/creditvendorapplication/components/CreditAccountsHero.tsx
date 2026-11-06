import React from 'react'
import { Link } from 'react-router-dom'

const GUIDE_PATH = '/credit-builder/guide'

interface StatProps {
  label: string
  icon: string
  /** Undefined while loading. */
  value?: React.ReactNode
}

function Stat({ label, icon, value }: StatProps) {
  return (
    <div className="ca-stat" role="group" aria-label={label}>
      <span className="ca-stat-head">
        <span className="ca-stat-icon" aria-hidden="true"><i className={icon}></i></span>
        <span className="ca-stat-label">{label}</span>
      </span>
      {value === undefined
        ? <span className="ca-sk ca-sk-figure" aria-hidden="true"></span>
        : <span className="ca-stat-value">{value}</span>}
    </div>
  )
}

interface CreditAccountsHeroProps {
  /** Accounts matching the current filters; undefined while loading. */
  total?: number
  /** The tier's name ("Tier 4"); undefined while loading. Not user.current_tier, which is the tier's id. */
  tierName?: string
  locked: boolean
}

/** Credit Accounts' opening band, in the same language as My Applications. */
export default function CreditAccountsHero({ total, tierName, locked }: CreditAccountsHeroProps) {
  return (
    <section className="ca-hero" aria-labelledby="ca-hero-title">
      <div className="ca-hero-main">
        <span className="ca-hero-eyebrow">
          <i className="ri-bank-card-line" aria-hidden="true"></i> Credit Builder
        </span>
        <h1 id="ca-hero-title" className="ca-hero-title">Credit Accounts</h1>
        <p className="ca-hero-subtitle">
          Apply to pre-vetted vendors for business credit. Filter by category or issuer to find the best matches for your business.
        </p>
        <Link to={GUIDE_PATH} className="ca-hero-cta">
          <i className="ri-book-open-line" aria-hidden="true"></i>Step-By-Step Guide
        </Link>
      </div>

      <div className="ca-stats">
        <Stat
          label="Accounts available"
          icon="ri-stack-line"
          value={locked ? <><i className="ri-lock-2-line" aria-hidden="true"></i> Locked</> : total}
        />
        <Stat label="Your tier" icon="ri-vip-crown-2-line" value={tierName} />
      </div>
    </section>
  )
}
