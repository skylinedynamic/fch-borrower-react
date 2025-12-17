import React from 'react'

export default function CreditProgressLoader() {
  return (
    <div className="card mb-3 credit-overview-page">
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          <div className="skeleton-line skeleton-header-title"></div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="skeleton-line skeleton-badge-sm"></div>
          <div className="skeleton-line skeleton-badge-lg"></div>
        </div>
      </div>
      <div className="card-body">
        {/* Progress bar */}
        <div className="skeleton-line skeleton-progress-bar w-100"></div>
        
        {/* Tier icon circles and labels */}
        <div className="d-flex justify-content-between mt-3">
          {[...Array(5)].map((_, i) => (
            <div className="skeleton-tier-wrapper text-center" key={i}>
              {/* Circle icon */}
              <div className="skeleton-circle skeleton-tier-circle mx-auto mb-1"></div>
              {/* Tier name */}
              <div className="skeleton-line skeleton-tier-label mx-auto"></div>
            </div>
          ))}
        </div>
        
        {/* Title and description */}
        <div className="mt-4">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-desc-line w-100"></div>
          <div className="skeleton-line skeleton-desc-line w-100"></div>
          <div className="skeleton-line skeleton-desc-short"></div>
        </div>
        
        {/* Footer info */}
        <div className="d-flex justify-content-start gap-5 mt-2">
          <div className="skeleton-line skeleton-footer-lg"></div>
          <div className="skeleton-line skeleton-footer-sm"></div>
        </div>
      </div>
    </div>
  )
}
