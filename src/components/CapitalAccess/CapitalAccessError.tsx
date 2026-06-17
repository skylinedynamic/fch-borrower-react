import React from 'react'
import CapitalAccessPageHeader from './CapitalAccessPageHeader'

export default function CapitalAccessError() {
  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="ca-page-wrap">
          <CapitalAccessPageHeader />
          <div className="text-center py-5">
            <i className="ri-error-warning-line fs-40 text-danger mb-2"></i>
            <h5 className="fw-semibold">Error loading capital access overview</h5>
            <p className="text-muted fs-13">Please try reloading the page.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
