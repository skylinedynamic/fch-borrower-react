import React from 'react'
import { useAuthStore } from '../../store/auth/authStore'
import { useCapitalAccessOverview } from '../../modules/capital-access/queries'

import CapitalAccessLocked from '../../components/CapitalAccess/CapitalAccessLocked'
import CapitalAccessError from '../../components/CapitalAccess/CapitalAccessError'
import CapitalAccessPageHeader from '../../components/CapitalAccess/CapitalAccessPageHeader'
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader'
import WelcomeHeader from '../../components/CapitalAccess/WelcomeHeader'
import FundingReadinessScoreCard from '../../components/CapitalAccess/FundingReadinessScoreCard'
import EstimatedTotalAccessCard from '../../components/CapitalAccess/EstimatedTotalAccessCard'
import RecommendedNextStep from '../../components/CapitalAccess/RecommendedNextStep'

export default function CapitalAccess() {
  const { user } = useAuthStore()
  const firstName = user?.name ? user.name.split(' ')[0] : 'User'

  const { data: overview, isLoading, isError } = useCapitalAccessOverview()

  if (!user?.credit_profile_updated) {
    return <CapitalAccessLocked />
  }

  if (isError) {
    return <CapitalAccessError />
  }

  const score = overview?.readiness_score ?? 0
  const status = overview?.readiness_status ?? 'N/A'
  const factors = overview?.factors ?? []
  const totalAccess = overview?.estimated_total_access ?? '$0'
  const breakdown = overview?.breakdown ?? []

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="ca-page-wrap">
          <CapitalAccessPageHeader />

          <div className="ca-dashboard-welcome">
            <WelcomeHeader firstName={firstName} />

            {isLoading ? (
              <CapitalAccessLoader type="detail" />
            ) : (
              <>
                <div className="row g-4 mb-4">
                  <FundingReadinessScoreCard
                    score={score}
                    status={status}
                    factors={factors}
                  />
                  <EstimatedTotalAccessCard
                    totalAccess={totalAccess}
                  />
                </div>

                <RecommendedNextStep />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
