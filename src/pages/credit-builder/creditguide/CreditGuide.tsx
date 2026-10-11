import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ActivityLog from '../../../components/ActivityLog/ActivityLog'
import RecommendedActions from '../../../components/RecommendedActions/RecommendedActions'
import ProgressStats from './components/ProgressStats'
import TierAccordion from './components/TierAccordion'
import TierTaskListLoader from '../../../components/Loader/TierTaskListLoader'
import { useTierTaskList, useCreditProgress } from '../../../modules/credit-builder/overview'
import { CREDIT_BUILDER_STATUS } from '../../../data/credit-builder'

import { TierTask as TierTaskType } from '../../../modules/credit-builder/guide/types'
import TaskCompleteModal from './components/TaskCompleteModal'

export default function CreditGuide() {
  const [openTier, setOpenTier] = useState<number>(0)
  const { data: tiers, isLoading: isLoadingTiers, isError: isErrorTiers } = useTierTaskList()
  const { data: progressData, isLoading: isLoadingProgress, isError: isErrorProgress } = useCreditProgress()

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TierTaskType | null>(null)

  const isLoading = isLoadingTiers || isLoadingProgress
  const isError = isErrorTiers || isErrorProgress || !tiers || !progressData

  useEffect(() => {
    const bootstrapLib = (window as unknown as { bootstrap?: any }).bootstrap
    const els = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    if (bootstrapLib && els.length) {
      els.forEach((el) => {
        try { new bootstrapLib.Tooltip(el) } catch { }
      })
    }
  }, [tiers])

  // Calculate overall progress safely
  const totalTasks = tiers ? tiers.reduce((sum, tier) => sum + tier.tasks.length, 0) : 0
  const completedTasks = tiers ? tiers.reduce((sum, tier) =>
    sum + tier.tasks.filter(t => t.status === CREDIT_BUILDER_STATUS.VERIFIED).length, 0
  ) : 0

  // Use API state for current tier instead of derived tasks
  const currentTier = tiers && progressData ? tiers.find(t => t.id === progressData.id) : null

  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  useEffect(() => {
    if (currentTier) {
      setOpenTier(currentTier.id)
    }
  }, [currentTier?.id])

  // Only show error if NOT loading and error exists. Placed after every hook
  // declaration above (Rules of Hooks: an early return between hook calls
  // means a different hook count between the loading and error renders,
  // which crashes React with "Rendered fewer hooks than expected").
  if (!isLoading && isError) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center text-muted py-5">
                  <i className="ri-error-warning-line fs-1"></i>
                  <p className="mt-2">Failed to load credit guide</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleTaskClick = (task: TierTaskType) => {
    setSelectedTask(task)
    setModalOpen(true)
  }

  const handleConfirmCompletion = () => {
    // API Call would go here
    console.log('Completing task:', selectedTask?.id)
    setModalOpen(false)
  }

  const handleCompleteTier = (tier: any) => {
    // Placeholder handler for button click
    console.log('Complete Tier clicked:', tier.id)
  }

  const estDays = progressData?.current_tier_estimated_completion_days ?? 0
  const estTimeLabel = estDays === 0 ? "Ready for Next Tier" : `${estDays} Days`

  return (
    <div className="page-content credit-guide-page">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex align-items-center py-2">
              <div>
                <h4 className="fs-20 mb-1">Credit Building Guide</h4>
                <p className="text-muted mb-0">Follow a step-by-step path to establish, build, and monitor your business credit</p>
              </div>
            </div>
          </div>

          <div className="col-xl-12">
            <div className="card mb-3">
              <div className="card-body">
                {isLoadingProgress || !progressData ? (
                  /* Progress Stats Skeleton */
                  <div className="stats mb-4">
                    {[...Array(4)].map((_, i) => (
                      <div className="stat" key={i}>
                        <div className="skeleton-line skeleton-stat-value mb-1"></div>
                        <div className="skeleton-line skeleton-stat-label"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ProgressStats
                    currentTier={progressData.name}
                    overallProgress={`${progressData.total_complete_percentage}%`}
                    estTimeToNext={estTimeLabel}
                    tasksCompleted={`${progressData.total_complete_task}/${progressData.total_complete_task + progressData.total_tasks_remaining}`}
                  />
                )}

                {isLoadingTiers || !tiers ? (
                  <TierTaskListLoader />
                ) : (

                  tiers.map((tier, index) => {
                    const currentTierIndex = tiers.findIndex(t => t.id === currentTier?.id)
                    const isLocked = index > currentTierIndex

                    return (
                      <TierAccordion
                        key={tier.id}
                        tier={tier}
                        isOpen={openTier === tier.id}
                        isLocked={isLocked}
                        onToggle={() => {
                          if (!isLocked) {
                            setOpenTier(openTier === tier.id ? -1 : tier.id)
                          } else {
                            // Logic for future tiers
                            // Collect names of all tiers between current and this one (inclusive of current, exclusive of this one)
                            // actually requirements says: "you have to complete tier_id 0 ,1 name have to complete"
                            // so we list all tiers from currentTierIndex up to (targetIndex - 1)

                            const missingTiers = tiers.slice(currentTierIndex, index)
                            const names = missingTiers.map(t => t.name).join(', ')
                            toast.error(`You have to complete ${names}`)
                          }
                        }}
                        isCurrentTier={currentTier?.id === tier.id}
                        isFirstTier={index === 0}
                        onTaskClick={handleTaskClick}
                        onCompleteTier={handleCompleteTier}
                      />
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* <div className="col-xl-3">
            <ActivityLog />
            <RecommendedActions />
          </div> */}
        </div>
      </div>

      <TaskCompleteModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmCompletion}
        text={selectedTask ? `Are you sure you have completed the task "${selectedTask.title}"?` : undefined}
      />
    </div>
  )
}
