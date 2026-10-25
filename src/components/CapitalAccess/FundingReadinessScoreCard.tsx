import React from 'react'
import type { FactorDetail } from '../../modules/capital-access/types'

interface FundingReadinessScoreCardProps {
  score: number
  status: string
  factors: FactorDetail[]
  statusColor?: string
}

export default function FundingReadinessScoreCard({
  score,
  status,
  factors,
  statusColor,
}: FundingReadinessScoreCardProps) {
  return (
    <div className="col-md-6">
      <div className="ca-metric-card h-100">
        <div className="ca-metric-header">
          <div className="ca-metric-title-block">
            <h6 className="ca-metric-card-label">
              Credit Card Stacking Readiness Scores
            </h6>
            <div className="ca-score-display">
              <span
                className="ca-score-value animate__animated animate__fadeIn"
                style={statusColor ? { color: statusColor } : undefined}
              >
                {score}
              </span>
              <span
                className="ca-score-status"
                style={statusColor ? { color: statusColor, backgroundColor: `${statusColor}1A` } : undefined}
              >
                {status}
              </span>
            </div>
          </div>
          <div className="ca-metric-icon-wrapper readiness-icon">
            <i className="ri-shield-flash-line"></i>
          </div>
        </div>

        <div className="ca-slider-wrapper">
          <div className="ca-custom-progress-container">
            <div className="progress ca-custom-progress">
              <div
                className="progress-bar ca-progress-bar-green"
                role="progressbar"
                style={{
                  width: `${score}%`,
                  background: statusColor ? `linear-gradient(90deg, ${statusColor}, ${statusColor}cc)` : undefined
                }}
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
        </div>

        <div className="ca-score-factors">
          {factors.map((factor, idx) => (
            <div key={idx} className="ca-factor-row d-flex align-items-center justify-content-between py-1">
              <span className="ca-factor-label fw-medium text-muted small">{factor.label}</span>
              <span className="ca-factor-value fw-semibold small">
                {factor.status != null && factor.status !== factor.value
                  ? `${factor.status} (${factor.value})`
                  : factor.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
