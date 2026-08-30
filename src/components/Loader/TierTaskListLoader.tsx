import React from 'react'

export default function TierTaskListLoader() {
  return (
    <div className="credit-guide-page">
      {/* Stats Skeleton */}
      <div className="stats mb-3">
        {[...Array(4)].map((_, i) => (
          <div className="stat" key={i}>
            <div className="skeleton-line" style={{ width: '60%', height: 20, borderRadius: 4, marginBottom: 4 }}></div>
            <div className="skeleton-line" style={{ width: '80%', height: 14, borderRadius: 4 }}></div>
          </div>
        ))}
      </div>

      {/* Tier Skeletons */}
      {[...Array(5)].map((_, i) => (
        <div className="tier mt-3" key={i} style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
          <div className="tier-head" style={{ background: '#f8f9fa', cursor: 'default' }}>
            <div className="tier-info" style={{ flex: 1 }}>
              <div className="skeleton-line" style={{ width: '40%', height: 18, borderRadius: 4, marginBottom: 8 }}></div>
              <div className="skeleton-line" style={{ width: '90%', height: 14, borderRadius: 4 }}></div>
            </div>
            <div className="tier-meta">
              <div className="skeleton-line" style={{ width: 50, height: 24, borderRadius: 999 }}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
