import React, { useState } from 'react'
import { TierTask as TierTaskType } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'
import TaskDetailsModal from './TaskDetailsModal'
import TaskStatusAction from './TaskStatusAction'
import { Tier } from '../../../../modules/credit-builder/guide/types'



export interface Tier1TaskProps {
  tierId: number
  task: TierTaskType
  isCurrentTier?: boolean
  isFirstTier?: boolean
  onTaskClick?: (task: TierTaskType) => void
  onVerifyClick?: (task: TierTaskType) => void
  index: number
  tierDescription?: string | null
}



export default function Tier1Task({ tierId, task, isCurrentTier, isFirstTier, onTaskClick, onVerifyClick, index, tierDescription }: Tier1TaskProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const isDone = task.status === CREDIT_BUILDER_STATUS.VERIFIED
  const isProcessing = task.status === CREDIT_BUILDER_STATUS.PROCESSING
  const isRejected = task.status === CREDIT_BUILDER_STATUS.REJECTED

  const state = isDone ? 'is-verified' : isProcessing ? 'is-review' : isRejected ? 'is-rejected' : 'is-pending'

  const logoSrc = task.vendor?.logo

  const handleModalVerify = (task: TierTaskType) => {
    // Small delay to allow TaskDetailsModal to close and cleanup body classes
    setTimeout(() => {
      if (onVerifyClick) onVerifyClick(task)
    }, 500)
  }

  return (
    <>
      {/* Tier warning box - only for the first item */}
      {index === 0 && tierDescription ? (
        <div className="cg-tier-note" dangerouslySetInnerHTML={{ __html: tierDescription }} />
      ) : null}

      <div className={`cg-vendor ${state}`} data-task={task.id}>
        <div className="cg-vendor-index" aria-hidden="true">
          {(index ?? 0) + 1}
        </div>

        <div className="cg-vendor-logo">
          {logoSrc ? (
            <img src={logoSrc} alt={task.title} />
          ) : (
            <span aria-hidden="true">{task.title.substring(0, 3).toUpperCase()}</span>
          )}
        </div>

        <div className="cg-step-body">
          <div className="cg-step-title">{task.title}</div>
          {task.subtitle && <div className="cg-step-subtitle">{task.subtitle}</div>}
          <div className="cg-step-review">
            <i className="ri-shield-check-line" aria-hidden="true"></i> Vendor eligibility reviewed by FCH underwriting
          </div>
        </div>

        <div className="cg-step-action">
          <div className="cg-actions">
            {/* Status, once the task has been submitted */}
            {(isDone || isProcessing || isRejected) && <TaskStatusAction task={task} canSubmit={false} />}

            <button type="button" className="cg-btn cg-btn-outline" onClick={() => setModalOpen(true)}>
              <i className="ri-file-list-3-line" aria-hidden="true"></i> View Instructions
            </button>
          </div>
        </div>
      </div>

      <TaskDetailsModal
        isOpen={modalOpen}
        toggle={() => setModalOpen(!modalOpen)}
        task={task}
        logoSrc={logoSrc}
        onVerifyClick={handleModalVerify}
      />
    </>
  )
}
