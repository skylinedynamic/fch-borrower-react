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
  const [selectedTask, setSelectedTask] = useState<TierTaskType | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const verifyTierTasksMutation = useVerifyTierTasks()

  const handleVerifyClick = (task: TierTaskType) => {
    setSelectedTask(task)
    setShowConfirmModal(true)
  }

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
                onVerifyClick={handleVerifyClick}
              />
            ))}
          </div>
        </div>
      )}

      <ConfirmationModal
        show={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false)
          setSelectedTask(null)
        }}
        onConfirm={() => {
          if (!selectedTask) return
          verifyTierTasksMutation.mutate(
            { task_ids: [selectedTask.id] },
            {
              onSuccess: (response) => {
                setShowConfirmModal(false)
                setSelectedTask(null)
                toast.success(response.message || 'Task verification request submitted successfully')
              },
              onError: (error: any) => {
                setShowConfirmModal(false)
                setSelectedTask(null)
                const message = error?.response?.data?.message || 'Failed to submit verification request'
                toast.error(message)
              }
            }
          )
        }}
        title={selectedTask ? `Verify ${selectedTask.title}` : 'Verify Task'}
        message={selectedTask ? `Are you sure you want to submit "${selectedTask.title}" for verification? This will be reviewed by FCH underwriting.` : 'Are you sure you want to verify this task?'}
        confirmText="Submit for Verification"
        cancelText="Cancel"
        loading={verifyTierTasksMutation.isPending}
        loadingText="Submitting..."
      />
    </div>
  )
}
