import React from 'react'

export default function DocumentUploadSkeleton() {
  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="skeleton-line sk-card"></div>
      </div>
      <div className="col-12 d-flex justify-content-between mt-2">
        <div className="skeleton-line sk-btn"></div>
        <div className="skeleton-line sk-btn"></div>
      </div>
    </div>
  )
}
