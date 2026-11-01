import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ActivityLog from '../../../components/ActivityLog/ActivityLog'
import RecommendedActions from '../../../components/RecommendedActions/RecommendedActions'
import ProgressStats, { ProgressStatsSkeleton } from './components/ProgressStats'
import TierAccordion from './components/TierAccordion'
import TierTaskListLoader from '../../../components/Loader/TierTaskListLoader'
import { useTierTaskList, useCreditProgress } from '../../../modules/credit-builder/overview'
import { CREDIT_BUILDER_STATUS } from '../../../data/credit-builder'

import { TierTask as TierTaskType } from '../../../modules/credit-builder/guide/types'
import TaskCompleteModal from './components/TaskCompleteModal'
import './CreditGuide.css'

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
  // Nothing left: ready. Still a task to do but none listed yet (it arrives
  // from the tier below), so no estimate - not "ready" (BUG-024).
  const estTimeLabel = (progressData?.current_tier_tasks_remaining ?? 0) === 0
    ? 'Ready for Next Tier'
    : estDays > 0 ? `${estDays} Days` : '—'

  return (
    <div className="page-content credit-guide-page cg-page">
      <div className="container-fluid">
        {/* Hero */}
        <section className="cg-hero">
          <span className="cg-hero-orb" aria-hidden="true"></span>
          <div className="cg-hero-main">
            <span className="cg-hero-eyebrow">
              <i className="ri-building-2-line" aria-hidden="true"></i> Credit Builder
            </span>
            <h1 className="cg-hero-title">Credit Building Guide</h1>
            <p className="cg-hero-subtitle">
              Follow a step-by-step path to establish, build, and monitor your business credit
            </p>
          </div>

          {progressData && (
            <div className="cg-hero-journey">
              <div className="cg-hero-journey-top">
                <span>Your journey</span>
                <strong>{progressData.total_complete_percentage}%</strong>
              </div>
              <div
                className="cg-hero-bar"
                role="progressbar"
                aria-label="Credit building journey"
                aria-valuenow={Number(progressData.total_complete_percentage)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${Math.min(100, Number(progressData.total_complete_percentage) || 0)}%` }}></span>
              </div>
              <div className="cg-hero-journey-sub">
                {progressData.total_complete_task} of {progressData.total_complete_task + progressData.total_tasks_remaining} tasks verified
              </div>
            </div>
          )}
        </section>

        <div
          className="cg-body"
          role={isLoading ? 'status' : undefined}
          aria-busy={isLoading ? true : undefined}
          aria-label={isLoading ? 'Loading credit guide' : undefined}
        >
          {isLoadingProgress || !progressData ? (
            <ProgressStatsSkeleton />
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
            <div className="cg-tiers">
              {tiers.map((tier, index) => {
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
              })}
            </div>
          )}
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
