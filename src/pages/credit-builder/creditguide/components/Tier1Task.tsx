import React, { useState } from 'react'
import { TierTask as TierTaskType } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'
import { UncontrolledTooltip } from 'reactstrap'
import TaskDetailsModal from './TaskDetailsModal'
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

  const bgColorClass = isDone ? 'bg-success' : isProcessing ? 'bg-info' : isRejected ? 'bg-danger' : 'bg-warning'

  let statusText
  if (isDone) {
    statusText = 'Request Verified'
  } else if (isProcessing) {
    statusText = 'Verification Under Processing'
  } else if (isRejected) {
    statusText = 'Verification Rejected'
  } else {
    statusText = 'Pending' // Simplified for Tier 2 as per new design
  }

  const badgeId = `status-badge-${task.id}`

  const renderStatusBadge = () => {
    let colorClass = ''
    let icon = null
    if (isDone) {
      colorClass = 'text-success'
      icon = <i className="ri-checkbox-circle-fill fs-14 me-1"></i>
    }
    else if (isProcessing) {
      colorClass = 'text-info'
      icon = <i className="ri-time-line fs-14 me-1"></i>
    }
    else if (isRejected) {
      colorClass = 'text-danger'
      icon = <i className="ri-close-circle-fill fs-14 me-1"></i>
    }

    return (
      <span
        id={badgeId}
        className={`${colorClass} small text-decoration-underline d-flex align-items-center cursor-pointer`}
      >
        {icon}
        {statusText}
      </span>
    )
  }

  const logoSrc = task.vendor?.logo

  const handleModalVerify = (task: TierTaskType) => {
    // Small delay to allow TaskDetailsModal to close and cleanup body classes
    setTimeout(() => {
      if (onVerifyClick) onVerifyClick(task)
    }, 500)
  }

  return (
    <>
      {/* Tier 1 Warning Box - Only for first item */}
      {index === 0 && (
        tierDescription ? (
          <div dangerouslySetInnerHTML={{ __html: tierDescription }} />
        ) : ''
      )}
      <div className="tier-task-item tier-vendor-task-item d-flex align-items-center gap-3 p-3 border rounded mb-2">
        {/* Index Number */}
        <div className={`tier-index-box d-flex align-items-center justify-content-center ${bgColorClass} text-white rounded font-weight-bold`}>
          {index + 1}
        </div>

        {/* Logo */}
        <div className="tier-logo-box d-flex align-items-center justify-content-center">
          {logoSrc ? (
            <img src={logoSrc} alt={task.title} className="img-fluid" />
          ) : (
            <div className="text-muted small text-center fw-bold">{task.title.substring(0, 3).toUpperCase()}</div>
          )}
        </div>

        {/* Content */}
        <div className="task-details-col flex-grow-1">
          <div className="task-title fw-bold">
            {task.title}
          </div>
          {task.subtitle && (
            <div className="task-subtitle text-muted small mt-1">
              {task.subtitle}
            </div>
          )}
        </div>

        {/* Right Side Status & Actions */}
        <div className="task-action-col d-flex flex-column align-items-end justify-content-center">
          <div className="text-primary small mb-1 text-end vendor-eligibility-text">
            Vendor eligibility reviewed by FCH underwriting
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Status Display */}
            {(isRejected || isDone) ? (
              <>
                {renderStatusBadge()}
                <UncontrolledTooltip placement="top" target={badgeId}>
                  {task.note || 'No note provided.'}
                </UncontrolledTooltip>
              </>
            ) : isProcessing ? (
              renderStatusBadge()
            ) : null}

            <span
              className="text-primary cursor-pointer text-decoration-underline small"
              onClick={() => setModalOpen(true)}
              role="button"
            >
              View Instructions
            </span>
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
