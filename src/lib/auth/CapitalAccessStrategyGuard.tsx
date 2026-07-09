import React from 'react'
import { Outlet, useParams, Navigate } from 'react-router-dom'
import { useCapitalAccessStrategies } from '../../modules/capital-access/queries'
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader'

/**
 * Route-level guard that protects all /capital-access/:id/* sub-routes.
 * If the URL strategy ID does not match the user's recommended (accessible)
 * strategy, the user is immediately redirected to the strategy selection page.
 * This replaces the per-page isAccessible checks that previously existed in
 * PlayOverview, PreFlightChecklist, PlayRoadmap, and StepDetail.
 */
export default function CapitalAccessStrategyGuard() {
  const { id } = useParams<{ id: string }>()
  const { data: strategies, isLoading } = useCapitalAccessStrategies()

  if (isLoading) {
    return (
      <div className="page-content capital-access-page">
        <div className="container-fluid">
          <div className="ca-page-wrap">
            <CapitalAccessLoader type="list" />
          </div>
        </div>
      </div>
    )
  }

  const recommended = strategies?.find(p => p.isRecommended) || strategies?.[0]
  const isCompleted = strategies?.some(p => String(p.id) === String(id) && p.isCompleted)

  // If strategies have loaded and the requested ID doesn't match the
  // recommended play AND is not completed, redirect to strategy selection.
  if (recommended && String(recommended.id) !== String(id) && !isCompleted) {
    return <Navigate to="/capital-access/strategy" replace />
  }

  return <Outlet />
}

