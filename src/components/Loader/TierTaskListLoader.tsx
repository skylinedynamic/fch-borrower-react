import React from 'react'
import '../../pages/credit-builder/creditguide/CreditGuide.css'

/** Placeholder tier cards for the Step by Step Guide while its tasks load. */
export default function TierTaskListLoader() {
  return (
    <div className="cg-tiers" aria-hidden="true">
      {[...Array(4)].map((_, i) => (
        <div className="cg-tier is-open" key={i}>
          <div className="cg-tier-head" style={{ cursor: 'default' }}>
            <span className="cg-sk" style={{ width: 44, height: 44 }}></span>
            <div className="cg-tier-heading">
              <span className="cg-sk d-block mb-2" style={{ width: '38%', height: 16 }}></span>
              <span className="cg-sk d-block" style={{ width: '70%', height: 12 }}></span>
            </div>
            <div className="cg-tier-meta">
              <span className="cg-sk" style={{ width: 78, height: 24 }}></span>
              <span className="cg-sk" style={{ width: 92, height: 24 }}></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
