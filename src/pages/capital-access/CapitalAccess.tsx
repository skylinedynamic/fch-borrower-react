import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/auth/authStore'
import { useCapitalAccessOverview } from '../../modules/capital-access/queries'

import CommonErrorPage from '../../components/Common/CommonErrorPage'
import CapitalAccessPageHeader from '../../components/CapitalAccess/CapitalAccessPageHeader'
import CapitalAccessOverviewLoader from '../../components/Loader/CapitalAccessOverviewLoader'
import WelcomeHeader from '../../components/CapitalAccess/WelcomeHeader'
import FundingReadinessScoreCard from '../../components/CapitalAccess/FundingReadinessScoreCard'
import EstimatedTotalAccessCard from '../../components/CapitalAccess/EstimatedTotalAccessCard'
import RecommendedNextStep from '../../components/CapitalAccess/RecommendedNextStep'
import { isCapitalAccessLocked } from '../../config/capitalAccess'

export default function CapitalAccess() {
  const { user } = useAuthStore()
  const firstName = user?.name ? user.name.split(' ')[0] : 'User'

  const { data: overview, isLoading, isError } = useCapitalAccessOverview()

  if (isError) {
    return (
      <CommonErrorPage
        title="Error loading capital access overview"
        description="Please try reloading the page."
      />
    )
  }

  if (isLoading) return <CapitalAccessOverviewLoader />

  const score = overview?.readiness_score ?? 0
  const status = overview?.readiness_status ?? 'N/A'
  const statusColor = overview?.readiness_status_color
  const factors = overview?.factors ?? []
  // Short ($1.4M, the API's formatCompactCurrency), the full amount on hover (BUG-031).
  const totalAccessFull = overview?.estimated_total_access ?? '$0'
  const totalAccess = overview?.estimated_total_access_compact || totalAccessFull

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="ca-page-wrap">
          <CapitalAccessPageHeader />

          <div className="ca-dashboard-welcome">
            <WelcomeHeader firstName={firstName} />
            <div className="row g-4 mb-4">
              <FundingReadinessScoreCard
                score={score}
                status={status}
                factors={factors}
                statusColor={statusColor}
              />
              <EstimatedTotalAccessCard
                totalAccess={totalAccess}
                totalAccessFull={totalAccessFull}
                exposureBreakdown={overview?.exposure_breakdown}
                statusColor={statusColor}
                reasonCode={overview?.reason_code}
                unlockAt={overview?.unlock_at}
              />
            </div>

            {overview?.current_play ? (
              <div className="card mt-4 border-primary shadow-sm" style={{ background: 'rgba(64, 81, 137, 0.03)' }}>
                <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div>
                    <h5 className="fw-bold mb-1 text-dark fs-16">Active Strategy Play</h5>
                    <p className="text-muted mb-0 fs-13">
                      You are currently working on the <strong>{overview.current_play.name}</strong> play.
                    </p>
                  </div>
                  <Link
                    to={`/credit-card-stacking/${overview.current_play.id}/roadmap`}
                    className="ca-btn ca-btn-primary"
                    style={{ minWidth: '160px', background: 'var(--primary-color, #405189)', borderColor: 'var(--primary-color, #405189)' }}
                  >
                    View Roadmap <i className="ri-arrow-right-line ms-1"></i>
                  </Link>
                </div>
              </div>
            ) : (
              <RecommendedNextStep
                locked={isCapitalAccessLocked(overview?.reason_code)}
                disabled={overview?.reason_code === 'NO_ACTIVE_PLAYS' || overview?.reason_code === 'ALL_PLAYS_COMPLETED'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
