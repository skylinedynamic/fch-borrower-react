import React from 'react'

interface FundingReadinessScoreCardProps {
  score: number
  status: string
  minTop: number
  maxTop: number
  minBottom: number
  maxBottom: number
  factors: string[]
}

export default function FundingReadinessScoreCard({
  score,
  status,
  minTop,
  maxTop,
  minBottom,
  maxBottom,
  factors,
}: FundingReadinessScoreCardProps) {
  return (
    <div className="col-md-6">
      <div className="ca-metric-card h-100">
        <div className="ca-metric-header">
          <div className="ca-metric-title-block">
            <h6 className="ca-metric-card-label">
              Funding Readiness Score
            </h6>
            <div className="ca-score-display">
              <span className="ca-score-value animate__animated animate__fadeIn">{score}</span>
              <span className="ca-score-status">{status}</span>
            </div>
          </div>
          <div className="ca-metric-icon-wrapper readiness-icon">
            <i className="ri-shield-flash-line"></i>
          </div>
        </div>

        <div className="ca-slider-wrapper">
          <div className="ca-slider-labels ca-slider-labels-top">
            <span>{minTop}</span>
            <span>{maxTop}</span>
          </div>
          <div className="ca-custom-progress-container">
            <div className="progress ca-custom-progress">
              <div
                className="progress-bar ca-progress-bar-green"
                role="progressbar"
                style={{ width: `${score}%` }}
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
          <div className="ca-slider-labels ca-slider-labels-bottom">
            <span>{minBottom}</span>
            <span>{maxBottom}</span>
          </div>
        </div>

        <div className="ca-score-factors">
          {factors.map((factor, idx) => (
            <span key={idx} className="ca-factor-tag">
              <i className="ri-checkbox-circle-fill"></i> {factor}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
