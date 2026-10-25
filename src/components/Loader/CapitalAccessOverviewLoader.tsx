import React from 'react'
import CapitalAccessPageHeader from '../CapitalAccess/CapitalAccessPageHeader'
import CapitalAccessLoader from './CapitalAccessLoader'

/**
 * The Credit Card Stacking overview while it loads: the same page head,
 * welcome line and cards skeleton the overview page shows (CapitalAccess).
 */
export default function CapitalAccessOverviewLoader() {
  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="ca-page-wrap" role="status" aria-label="Loading Credit Card Stacking overview">
          <CapitalAccessPageHeader />
          <div className="ca-dashboard-welcome">
            <div className="ca-welcome-header">
              <div className="skeleton-line" style={{ width: 220, height: 28, borderRadius: 6, marginBottom: 10 }} />
              <div className="skeleton-line" style={{ width: 180, height: 14, borderRadius: 4 }} />
            </div>
            <CapitalAccessLoader type="detail" />
          </div>
        </div>
      </div>
    </div>
  )
}
