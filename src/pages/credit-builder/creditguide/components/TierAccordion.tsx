import React, { useEffect, useRef, useState } from 'react'
import TierGenericTask from './TierGenericTask'
import Tier0Task from './Tier0Task'
import Tier1Task from './Tier1Task'
import Tier2Task from './Tier2Task'
import Tier3Task from './Tier3Task'
import Tier4Task from './Tier4Task'
import { toast } from 'react-toastify'
import { useVerifyTierTasks } from '../../../../modules/credit-builder/guide/queries'
import { Tier, TierTask as TierTaskType } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'
import { tierCode } from '../../../../data/tier'
import { useOnboardingSuggestion } from '../../../../modules/onboarding'
import VerifyTasksModal from './VerifyTasksModal'
import Tier0SubmittedModal from './Tier0SubmittedModal'
import { useOnboardingPopupStore } from '../../../../store/onboardingPopupStore'
import PointerFinger from './PointerFinger'
import { isAwaitingSubmission, supportsVerifyAll, toVerificationBatches } from '../taskVerification'
import './VerifyAll.css'

interface TierAccordionProps {
  tier: Tier
  isOpen: boolean
  onToggle: () => void
  isCurrentTier?: boolean
  onTaskClick?: (task: TierTaskType) => void
  onCompleteTier?: (tier: Tier) => void
  isFirstTier?: boolean
  isLocked?: boolean
}

export default function TierAccordion({ tier, isOpen, onToggle, isCurrentTier, onTaskClick, onCompleteTier, isFirstTier, isLocked }: TierAccordionProps) {
  const completedCount = tier.tasks.filter(t => t.status === CREDIT_BUILDER_STATUS.VERIFIED).length
  const totalCount = tier.task_to_complete ? tier.task_to_complete : tier.tasks.length
  // The task(s) being confirmed: one from a step's button, or all of them from "Verify All".
  const [tasksToSubmit, setTasksToSubmit] = useState<TierTaskType[] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Tier 0 tasks just submitted, for the "submitted successfully" modal; 0 when closed.
  const [submittedCount, setSubmittedCount] = useState(0)
  const { hold: holdOnboardingPopup, release: releaseOnboardingPopup } = useOnboardingPopupStore()
  const verifyTierTasksMutation = useVerifyTierTasks()

  const canSubmit = !!(isFirstTier || isCurrentTier)
  const awaitingSubmission = tier.tasks.filter(isAwaitingSubmission)
  const showVerifyAll = canSubmit && supportsVerifyAll(tier) && awaitingSubmission.length > 0

  // The Getting Started walkthrough sends borrowers here to finish Tier 0, so
  // point them at the button that does it - until they've used it.
  const onboarding = useOnboardingSuggestion()
  const [pointerUsed, setPointerUsed] = useState(false)
  const guided = showVerifyAll && !pointerUsed && onboarding?.step.id === 'verify_all'
  const verifyAllRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Long tiers push the button off screen; bring it into view once.
    if (guided) verifyAllRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }, [guided])

  const handleVerifyClick = (task: TierTaskType) => setTasksToSubmit([task])

  // Tier 0 says it worked in a modal of its own, with what verifying it unlocks.
  const isTier0 = supportsVerifyAll(tier)

  const submitTasks = async () => {
    if (!tasksToSubmit) return
    setSubmitting(true)
    // Submitting can move the walkthrough on; its popup waits for ours.
    if (isTier0) holdOnboardingPopup()
    try {
      let message = ''
      for (const batch of toVerificationBatches(tasksToSubmit)) {
        const response = await verifyTierTasksMutation.mutateAsync({ ...batch, tier_id: tier.id })
        message = response.message
      }
      if (isTier0) setSubmittedCount(tasksToSubmit.length)
      else toast.success(message || 'Task verification request submitted successfully')
    } catch (error: any) {
      if (isTier0) releaseOnboardingPopup()
      toast.error(error?.response?.data?.message || 'Failed to submit verification request')
    } finally {
      setSubmitting(false)
      setTasksToSubmit(null)
    }
  }

  return (
    <div className={`tier mb-4 ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div
        className={`tier-accordion-header p-3 d-flex align-items-center justify-content-between ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={onToggle}
      >
        <div className="d-flex flex-column gap-1">
          <div className="d-flex align-items-center gap-2">
            <h5 className="tier-title m-0">
              {tier.name}: {tier.title}
            </h5>
            {tier.description && (
              <span
                className="info-badge"
                data-bs-toggle="tooltip"
                title={tier.description}
              >
                <i className="ri-flashlight-fill"></i>
              </span>
            )}
          </div>
          {tier.subtitle && (
            <div className="tier-desc">
              {tier.subtitle}
            </div>
          )}
        </div>


        <div className="d-flex align-items-center gap-3">
          <span className="count-badge">
            {completedCount}/{totalCount}
          </span>
          {!isLocked && (
            <i
              className="ri-arrow-down-s-line arrow-icon"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            ></i>
          )}
          {isLocked && (
            <i className="ri-lock-line text-muted fs-18"></i>
          )}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="tier-body p-3">

          {showVerifyAll && (
            <div className={`cg-verify-all ${guided ? 'is-guided' : ''}`} ref={verifyAllRef}>
              <div className="cg-verify-all-text">
                <span className="cg-verify-all-icon" aria-hidden="true">
                  <i className="ri-checkbox-multiple-line"></i>
                </span>
                <div>
                  <div className="cg-verify-all-title">
                    {awaitingSubmission.length} {awaitingSubmission.length === 1 ? 'task' : 'tasks'} ready to submit
                  </div>
                  <div className="cg-verify-all-sub">Done with them all? Send them for verification in one go.</div>
                </div>
              </div>
              <div className="cg-verify-all-cta">
                {guided && <PointerFinger label="Submit all your tasks here" />}
                <button
                  type="button"
                  className={`cg-btn cg-btn-info ${guided ? 'is-guided' : ''}`}
                  onClick={() => {
                    setPointerUsed(true)
                    setTasksToSubmit(awaitingSubmission)
                  }}
                >
                  <i className="ri-shield-check-line" aria-hidden="true"></i> Verify All
                </button>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="tier-tasks d-flex flex-column gap-2">
            {tier.tasks.map((task, index) => {
              const commonProps = {
                key: task.id,
                task: task,
                isCurrentTier: isCurrentTier,
                isFirstTier: isFirstTier,
                onTaskClick: onTaskClick,
                onVerifyClick: handleVerifyClick,
                index: index,
                tierDescription: tier.description,
              }

              if (tier.code === tierCode[0].value) {
                return <Tier0Task {...commonProps} />
              } else if (tier.code === tierCode[1].value) {
                return (
                  <Tier1Task
                    tierId={tier.id}
                    key={task.id}
                    task={task}
                    isCurrentTier={isCurrentTier}
                    isFirstTier={isFirstTier}
                    onTaskClick={onTaskClick}
                    onVerifyClick={handleVerifyClick}
                    index={index}
                    tierDescription={tier.description}
                  />
                )
              } else if (tier.code === tierCode[2].value) {
                return (
                  <Tier1Task
                    tierId={tier.id}
                    key={task.id}
                    task={task}
                    isCurrentTier={isCurrentTier}
                    isFirstTier={isFirstTier}
                    onTaskClick={onTaskClick}
                    onVerifyClick={handleVerifyClick}
                    index={index}
                    tierDescription={tier.description}
                  />
                )
              } else if (tier.code === tierCode[3].value) {
                return (
                  <Tier1Task
                    tierId={tier.id}
                    key={task.id}
                    task={task}
                    isCurrentTier={isCurrentTier}
                    isFirstTier={isFirstTier}
                    onTaskClick={onTaskClick}
                    onVerifyClick={handleVerifyClick}
                    index={index}
                    tierDescription={tier.description}
                  />
                )
              } else if (tier.code === tierCode[4].value) {
                return (
                  <Tier1Task
                    tierId={tier.id}
                    key={task.id}
                    task={task}
                    isCurrentTier={isCurrentTier}
                    isFirstTier={isFirstTier}
                    onTaskClick={onTaskClick}
                    onVerifyClick={handleVerifyClick}
                    index={index}
                    tierDescription={tier.description}
                  />
                )
              } else {
                return <TierGenericTask {...commonProps} />
              }
            })}
          </div>
        </div>
      )}

      <VerifyTasksModal
        tasks={tasksToSubmit}
        tierName={tier.name}
        submitting={submitting}
        onConfirm={submitTasks}
        onClose={() => setTasksToSubmit(null)}
      />

      <Tier0SubmittedModal
        count={submittedCount}
        tierName={tier.name}
        // Once Tier 0 is all in, the walkthrough moves on to the documents.
        nextStep={onboarding?.step.id === 'upload_documents' ? { label: 'Upload your documents', route: '/documents' } : null}
        onClose={() => {
          setSubmittedCount(0)
          releaseOnboardingPopup()
        }}
      />
    </div>
  )
}
