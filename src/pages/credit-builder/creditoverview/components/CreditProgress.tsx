import React from 'react'
import { useCreditProgress } from '../../../../modules/credit-builder/overview'
import OverviewHero from './OverviewHero'
import TierRoadmap from './TierRoadmap'
import CurrentTierCard from './CurrentTierCard'

/**
 * The Overview's progress: the header with the overall progress, the tier
 * roadmap and the current tier. The header - and its title - shows while the
 * progress loads or fails.
 */
export default function CreditProgress() {
  const { data, isLoading, isError } = useCreditProgress()

  if (isLoading) {
    return (
      <>
        <OverviewHero />
        <div className="co-card co-loading" aria-hidden="true">
          <span className="co-sk co-sk-line" style={{ width: '40%' }}></span>
          <span className="co-sk co-sk-bar"></span>
        </div>
      </>
    )
  }

  if (isError || !data) {
    return (
      <>
        <OverviewHero />
        <div className="co-card co-state">
          <i className="ri-error-warning-line" aria-hidden="true"></i>
          <p>Failed to load progress data</p>
        </div>
      </>
    )
  }

  const tiers = data.tiers ?? []
  const isLastTier = tiers.length > 0 && tiers[tiers.length - 1].id === data.id

  return (
    <>
      <OverviewHero progress={data} />
      <div className="co-grid">
        {tiers.length > 0 && <TierRoadmap tiers={tiers} currentTierId={data.id} />}
        <CurrentTierCard progress={data} isLastTier={isLastTier} />
      </div>
    </>
  )
}
