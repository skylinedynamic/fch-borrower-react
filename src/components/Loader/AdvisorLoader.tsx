import React from 'react'

export default function AdvisorLoader() {
  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-2">
        <div className="skeleton-circle advisor-skeleton-avatar"></div>
        <div className="flex-grow-1">
          <div className="skeleton-line w-50 mb-1"></div>
          <div className="skeleton-line w-75"></div>
        </div>
      </div>
      <div className="d-flex flex-column gap-2 mb-3">
        <div className="skeleton-line w-100 advisor-skeleton-item"></div>
        <div className="skeleton-line w-100 advisor-skeleton-item"></div>
        <div className="skeleton-line w-100 advisor-skeleton-item"></div>
      </div>
      <div className="skeleton-line w-100 advisor-skeleton-btn"></div>
    </div>
  )
}
