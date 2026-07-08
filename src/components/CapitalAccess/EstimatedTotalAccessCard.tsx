import React from 'react'
import type { ExposureBreakdownItem } from '../../modules/capital-access/types'

interface EstimatedTotalAccessCardProps {
  totalAccess: string
  exposureBreakdown?: ExposureBreakdownItem[]
  statusColor?: string
  reasonCode?: string | null
  unlockAt?: string | null
}

export default function EstimatedTotalAccessCard({
  totalAccess,
  exposureBreakdown,
  statusColor,
  reasonCode,
  unlockAt,
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

        {reasonCode && reasonCode !== 'NO_ACTIVE_PLAY_CHOSEN' && (
          <div className="mt-3 p-3 rounded-3 fs-13 d-flex align-items-center gap-3 animate__animated animate__fadeIn" style={{
            background: reasonCode === 'ALL_PLAYS_COMPLETED' ? 'rgba(16, 185, 129, 0.04)' : reasonCode === 'NEXT_PLAY_DELAY_ACTIVE' ? 'rgba(243, 156, 18, 0.04)' : 'rgba(250, 95, 95, 0.04)',
            border: reasonCode === 'ALL_PLAYS_COMPLETED' ? '1px solid rgba(16, 185, 129, 0.15)' : reasonCode === 'NEXT_PLAY_DELAY_ACTIVE' ? '1px solid rgba(243, 156, 18, 0.15)' : '1px solid rgba(250, 95, 95, 0.15)',
            color: reasonCode === 'ALL_PLAYS_COMPLETED' ? '#059669' : reasonCode === 'NEXT_PLAY_DELAY_ACTIVE' ? '#d97706' : '#dc2626',
            textAlign: 'left'
          }}>
            <span className="fs-18 flex-shrink-0">
              <i className={reasonCode === 'ALL_PLAYS_COMPLETED' ? 'ri-checkbox-circle-fill' : reasonCode === 'NEXT_PLAY_DELAY_ACTIVE' ? 'ri-time-line' : 'ri-lock-2-fill'}></i>
            </span>
            <div className="flex-grow-1">
              <strong className="d-block mb-1 fs-14" style={{ fontWeight: 600 }}>
                {reasonCode === 'ALL_PLAYS_COMPLETED' && 'All Plays Completed'}
                {reasonCode === 'NEXT_PLAY_DELAY_ACTIVE' && 'Next Play Delay Active'}
                {reasonCode === 'FICO_BELOW_MINIMUM' && 'Qualifications Not Met'}
                {reasonCode === 'TIER_BELOW_MINIMUM' && 'Tier Status Insufficient'}
                {reasonCode === 'UTILIZATION_ABOVE_MAXIMUM' && 'Utilization Too High'}
                {reasonCode === 'RECENT_LATE_PAYMENTS' && 'Recent Late Payments'}
                {reasonCode === 'REQUIREMENTS_NOT_MET' && 'Qualifications Not Met'}
              </strong>
              <span className="text-muted fs-12 leading-relaxed d-block" style={{ color: '#878a99' }}>
                {reasonCode === 'ALL_PLAYS_COMPLETED' && 'Congratulations! You have completed all available strategic funding plays.'}
                {reasonCode === 'NEXT_PLAY_DELAY_ACTIVE' && 'A cooling-off period is active. Your next recommended strategy is unlocking soon.'}
                {reasonCode === 'FICO_BELOW_MINIMUM' && 'Your current FICO score is below the minimum required for available plays.'}
                {reasonCode === 'TIER_BELOW_MINIMUM' && 'Your current business tier status does not meet the minimum requirements.'}
                {reasonCode === 'UTILIZATION_ABOVE_MAXIMUM' && 'Your credit utilization ratio exceeds the maximum threshold for strategic plays.'}
                {reasonCode === 'RECENT_LATE_PAYMENTS' && 'Recent late payments detected on your profile restrict access to new plays.'}
                {reasonCode === 'REQUIREMENTS_NOT_MET' && 'Your credit profile does not meet the minimum criteria to initiate plays.'}
              </span>
            </div>
          </div>
        )}

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
          <div className="d-flex flex-column align-items-center justify-content-center py-4 text-center animate__animated animate__fadeIn" style={{ minHeight: '120px' }}>
            <div className="avatar-md mb-2" style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(64, 81, 137, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color, #405189)',
              fontSize: '20px'
            }}>
              <i className="ri-bar-chart-2-line"></i>
            </div>
            <p className="text-muted mb-0 fs-12 fw-medium" style={{ maxWidth: '280px', lineHeight: '1.5', color: '#878a99' }}>
              Exposure projection chart is unavailable when there are no active eligible strategies.
            </p>
          </div>
        )}

        <div className="ca-access-footer">
          Across Eligible Plays
        </div>
      </div>
    </div>
  )
}

