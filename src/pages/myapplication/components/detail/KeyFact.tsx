import React from 'react'

/**
 * A headline figure in a detail hero, e.g. the requested amount. Same tile as
 * the My Applications totals: icon and label on one line, the value under them.
 */
export default function KeyFact({ label, value, icon }: { label: string; value: React.ReactNode; icon: string }) {
  return (
    <div className="ma-stat ma-fact" role="group" aria-label={label}>
      <span className="ma-tile-head">
        <span className="ma-stat-icon" aria-hidden="true"><i className={icon}></i></span>
        <span className="ma-stat-label">{label}</span>
      </span>
      <span className="ma-fact-value">{value || '—'}</span>
    </div>
  )
}
