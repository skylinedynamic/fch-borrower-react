import React, { useEffect, useState } from 'react'
import ActivityLog from '../../../components/ActivityLog/ActivityLog'
import RecommendedActions from '../../../components/RecommendedActions/RecommendedActions'
import ProgressStats from './components/ProgressStats'
import TierAccordion from './components/TierAccordion'
import TierTaskListLoader from '../../../components/Loader/TierTaskListLoader'
import { useTierTaskList } from '../../../modules/credit-builder/overview'

export default function CreditGuide() {
  const [openTier, setOpenTier] = useState<number>(0)
  const { data: tiers, isLoading, isError } = useTierTaskList()

  useEffect(() => {
    const bootstrapLib = (window as unknown as { bootstrap?: any }).bootstrap
    const els = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    if (bootstrapLib && els.length) {
      els.forEach((el) => {
        try { new bootstrapLib.Tooltip(el) } catch {}
      })
    }
  }, [tiers])

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="d-flex align-items-center mb-2">
                <div>
                  <h4 className="fs-20 mb-1">Credit Building Guide</h4>
                  <p className="text-muted mb-0">Follow a step-by-step path to establish, build, and monitor your business credit</p>
                </div>
              </div>
            </div>
            <div className="col-xl-9">
              <div className="card mb-3">
                <div className="card-body">
                  <TierTaskListLoader />
                </div>
              </div>
            </div>
            <div className="col-xl-3">
              <ActivityLog />
              <RecommendedActions />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !tiers) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center text-muted py-5">
                  <i className="ri-error-warning-line fs-1"></i>
                  <p className="mt-2">Failed to load tier task list</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate overall progress
  const totalTasks = tiers.reduce((sum, tier) => sum + tier.tasks.length, 0)
  const completedTasks = tiers.reduce((sum, tier) => 
    sum + tier.tasks.filter(t => t.status === 'completed').length, 0
  )
  const currentTier = tiers.find(t => t.tasks.some(task => task.status === 'pending')) || tiers[0]
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="page-content credit-guide-page">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex align-items-center mb-2">
              <div>
                <h4 className="fs-20 mb-1">Credit Building Guide</h4>
                <p className="text-muted mb-0">Follow a step-by-step path to establish, build, and monitor your business credit</p>
              </div>
            </div>
          </div>

          <div className="col-xl-9">
            <div className="card mb-3">
              <div className="card-body">
                <ProgressStats
                  currentTier={currentTier.order}
                  overallProgress={`${overallProgress}%`}
                  estTimeToNext={currentTier.estimated_completion_time}
                  tasksCompleted={`${completedTasks}/${totalTasks}`}
                />
                {tiers.map((tier) => (
                  <TierAccordion
                    key={tier.id}
                    tier={tier}
                    isOpen={openTier === tier.id}
                    onToggle={() => setOpenTier(openTier === tier.id ? -1 : tier.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="col-xl-3">
            <ActivityLog />
            <RecommendedActions />
          </div>
        </div>
      </div>
    </div>
  )
}
