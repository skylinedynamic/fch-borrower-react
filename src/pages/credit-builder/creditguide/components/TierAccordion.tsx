import React, { useState } from 'react'
import TierTask from './TierTask'
import { toast } from 'react-toastify'
import { useVerifyTierTasks } from '../../../../modules/credit-builder/guide/queries'
import { Tier, TierTask as TierTaskType } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'
import ConfirmationModal from '../../../../components/GlobalModal/ConfirmationModal'

interface TierAccordionProps {
  tier: Tier
  isOpen: boolean
  onToggle: () => void
  isCurrentTier?: boolean
  onTaskClick?: (task: TierTaskType) => void
  onCompleteTier?: (tier: Tier) => void
  isFirstTier?: boolean
}

export default function TierAccordion({ tier, isOpen, onToggle, isCurrentTier, onTaskClick, onCompleteTier, isFirstTier }: TierAccordionProps) {
  const completedCount = tier.tasks.filter(t => t.status === CREDIT_BUILDER_STATUS.COMPLETED).length
  const totalCount = tier.tasks.length
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const verifyTierTasksMutation = useVerifyTierTasks()

  return (
    <div className={`tier mb-4 ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div 
        className="tier-accordion-header p-3 d-flex align-items-center justify-content-between cursor-pointer"
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
          <i 
            className="ri-arrow-down-s-line arrow-icon" 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
            }}
          ></i>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="tier-body p-3">
          
          {/* Task List */}
          <div className="tier-tasks d-flex flex-column gap-2">
            {tier.tasks.map((task) => (
              <TierTask 
                key={task.id} 
                task={task} 
                isCurrentTier={isCurrentTier}
                isFirstTier={isFirstTier}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>


          {/* Tier 0 Verification Card - Moved to Bottom -- Show only if there are pending tasks */}
          {isFirstTier && tier.tasks.some(t => t.status == CREDIT_BUILDER_STATUS.PENDING) && (
            <div className="tier-verification-box mt-4">
              <div className="d-flex gap-3">
          
                <div>
                  <p className="verification-text">
                    Run the included Tier 0 verification to complete the required business identity and compliance checks. This runs once and is reviewed by FCH.
                  </p>
                  <div 
                    className="verification-action-block"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowConfirmModal(true)
                    }}
                  >
                    <span className="action-text">Run Included Tier 0 Verification (One-Time)</span>
                  </div>
                  <p className="verification-subtext">
                    Additional verifications require underwriting approval.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          verifyTierTasksMutation.mutate(
            { task_ids: tier.tasks.map(t => t.id) },
            {
              onSuccess: (response) => {
                setShowConfirmModal(false)
                toast.success(response.message || 'Task verify request submitted successfully')
                onCompleteTier?.(tier)
              },
              onError: (error: any) => {
                setShowConfirmModal(false)
                const message = error?.response?.data?.message || 'Failed to submit verification request'
                toast.error(message)
              }
            }
          )
        }}
        title="Run Tier 0 Verification"
        message="Are you sure you want to run the Tier 0 verification? This will initiate the business identity and compliance checks."
        confirmText="Run Verification"
        cancelText="Cancel"
        loading={verifyTierTasksMutation.isPending}
        loadingText="Submitting..."
      />
    </div>
  )
}
