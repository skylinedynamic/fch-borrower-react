import React from 'react'

interface EstimatedTotalAccessCardProps {
  totalAccess: string
  breakdown: Array<{ label: string; value: string }>
}

export default function EstimatedTotalAccessCard({
  totalAccess,
  breakdown,
}: EstimatedTotalAccessCardProps) {
  return (
    <div className="col-md-6">
      <div className="ca-metric-card h-100">
        <div className="ca-metric-header">
          <div className="ca-metric-title-block">
            <h6 className="ca-metric-card-label">
              Estimated Total Access
            </h6>
            <div className="ca-access-value animate__animated animate__fadeIn">
              {totalAccess}
            </div>
          </div>
          <div className="ca-metric-icon-wrapper access-icon">
            <i className="ri-money-dollar-box-line"></i>
          </div>
        </div>

        <div className="ca-access-footer">
          Across Eligible Plays
        </div>

        <div className="ca-breakdown-list">
          {breakdown.map((item, idx) => (
            <div key={idx} className="ca-breakdown-item">
              <span>{item.label}</span>
              <span className="value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
