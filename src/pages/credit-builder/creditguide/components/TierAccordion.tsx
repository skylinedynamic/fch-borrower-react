import React, { useState } from 'react'
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
import ConfirmationModal from '../../../../components/GlobalModal/ConfirmationModal'
import { tierCode } from '../../../../data/tier'

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
                    return <Tier2Task {...commonProps} />
                } else if (tier.code === tierCode[3].value) {
                    return <Tier3Task {...commonProps} />
                } else if (tier.code === tierCode[4].value) {
                    return <Tier4Task {...commonProps} />
                } else {
                    return <TierGenericTask {...commonProps} />
                }
            })}
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
