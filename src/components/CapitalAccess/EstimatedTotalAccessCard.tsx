import React from 'react'
import type { ExposureBreakdownItem } from '../../modules/capital-access/types'

interface EstimatedTotalAccessCardProps {
  totalAccess: string
  exposureBreakdown?: ExposureBreakdownItem[]
  statusColor?: string
}

export default function EstimatedTotalAccessCard({
  totalAccess,
  exposureBreakdown,
  statusColor,
}: EstimatedTotalAccessCardProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const maxVal = exposureBreakdown && exposureBreakdown.length > 0
    ? Math.max(...exposureBreakdown.map((item) => item.max_exposure))
    : 0

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

        {exposureBreakdown && exposureBreakdown.length > 0 ? (
          <div className="ca-exposure-vertical-chart">
            {exposureBreakdown.map((item, index) => {
              const percentage = maxVal > 0 ? (item.max_exposure / maxVal) * 100 : 0
              const barHeight = Math.max(percentage, 5)
              const barGradient = statusColor
                ? `linear-gradient(180deg, ${statusColor}cc 0%, ${statusColor} 100%)`
                : undefined

              return (
                <div
                  key={index}
                  className="ca-exposure-vertical-bar animate__animated animate__fadeInUp"
                  style={{
                    height: `${barHeight}%`,
                    background: barGradient
                  }}
                >
                  <div className="ca-bar-tooltip">
                    <span className="ca-tooltip-name">{item.name}</span>
                    <span className="ca-tooltip-value">{formatCurrency(item.max_exposure)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="ca-access-graphic-container animate__animated animate__fadeIn">
            <svg className="ca-access-chart-svg" viewBox="0 0 300 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="accessChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={statusColor || 'var(--primary-color, #405189)'} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={statusColor || 'var(--primary-color, #405189)'} stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path
                d="M0 65 C40 60, 60 40, 100 45 C140 50, 160 20, 200 25 C240 30, 260 8, 300 10 L300 80 L0 80 Z"
                fill="url(#accessChartGradient)"
              />
              <path
                d="M0 65 C40 60, 60 40, 100 45 C140 50, 160 20, 200 25 C240 30, 260 8, 300 10"
                fill="none"
                stroke={statusColor || 'var(--primary-color, #405189)'}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="100" cy="45" r="3" fill="#ffffff" stroke={statusColor || 'var(--primary-color, #405189)'} strokeWidth="1.5" />
              <circle cx="200" cy="25" r="3" fill="#ffffff" stroke={statusColor || 'var(--primary-color, #405189)'} strokeWidth="1.5" />
              <circle cx="300" cy="10" r="3.5" fill={statusColor || 'var(--primary-color, #405189)'} />
              <circle cx="300" cy="10" r="3" fill="none" stroke={statusColor || 'var(--primary-color, #405189)'} strokeWidth="1.5">
                <animate attributeName="r" values="3;9;3" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        )}

        <div className="ca-access-footer">
          Across Eligible Plays
        </div>
      </div>
    </div>
  )
}

