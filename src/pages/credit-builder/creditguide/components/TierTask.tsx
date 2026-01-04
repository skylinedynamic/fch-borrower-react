import React from 'react'
import { TierTask as TierTaskType } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'
import { UncontrolledTooltip } from 'reactstrap'

export interface TierTaskProps {
  task: TierTaskType
  isCurrentTier?: boolean
  isFirstTier?: boolean
  onTaskClick?: (task: TierTaskType) => void
  onVerifyClick?: (task: TierTaskType) => void
}

export default function TierTask({ task, isCurrentTier, isFirstTier, onTaskClick, onVerifyClick }: TierTaskProps) {
  const isDone = task.status === CREDIT_BUILDER_STATUS.VERIFIED
  const isProcessing = task.status === CREDIT_BUILDER_STATUS.PROCESSING
  const isRejected = task.status === CREDIT_BUILDER_STATUS.REJECTED
  
  // For both first tier and current tier pending tasks, they should be clickable for verification
  const isClickableForVerification = (isFirstTier || isCurrentTier) && !isDone && !isProcessing && !isRejected
  // Navigation is no longer needed for pending tasks in active tiers as they now go directly to verification
  const isClickableForNavigation = false
  // Rejected tasks are NOT clickable for navigation/verification in the same way, but the "Submit Again" button handles it.
  
  const isClickable = isClickableForVerification || isClickableForNavigation
  
  let statusIcon
  if (isDone) {
    statusIcon = <i className="ri-check-line"></i>
  } else if (isProcessing) {
    statusIcon = <i className="ri-loader-4-line spin-animation"></i>
  } else if (isRejected) {
    statusIcon = <i className="ri-close-line"></i>
  } else {
    statusIcon = <span>I</span>
  }

  let statusText
  if (isDone) {
    statusText = 'Verified'
  } else if (isProcessing) {
    statusText = 'Processing'
  } else if (isRejected) {
    statusText = 'Rejected'
  } else {
    statusText = task.button_title || 'Pending Verification'
  }

  let reviewText
  if (isDone) {
    reviewText = 'Verified by FCH'
    if (task.completed_at) {
      reviewText += ` on ${task.completed_at}`
    }
  } else if (isProcessing) {
    reviewText = 'Verification in progress'
  } else if (isRejected) {
    reviewText = 'Verification Rejected'
  } else {
    reviewText = 'Reviewed by FCH underwriting'
  }

  const badgeId = `status-badge-${task.id}`

  const renderStatusBadge = () => (
    <div 
      id={badgeId}
      className={`status-badge ${isDone ? 'completed' : isProcessing ? 'processing' : isRejected ? 'rejected' : 'pending'} ${isClickable ? 'clickable' : ''}`}
      onClick={() => {
        if (isClickableForVerification && onVerifyClick) {
          onVerifyClick(task)
        } else if (isClickableForNavigation && onTaskClick) {
          onTaskClick(task)
        }
      }}
    >
      {statusText}
    </div>
  )
  
  return (
    <div className="tier-task-item">
      <div className="d-flex gap-3 align-items-start flex-grow-1">
        {/* Icon Box */}
        <div className="task-icon-col">
          <div className={`task-status-icon ${isDone ? 'completed-icon' : isProcessing ? 'processing-icon' : isRejected ? 'rejected-icon' : 'pending-icon'}`}>
            {statusIcon}
          </div>
        </div>

        {/* Content */}
        <div className="task-details-col">
          <div className="task-title">
            {task.title}
          </div>
          {task.subtitle && (
            <div className="task-subtitle">
              {task.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right Side Status */}
      <div className="task-action-col">
        <div className="d-flex gap-2 align-items-center">
          {isRejected ? (
            <>
           
             
              {/* Rejected Badge with Tooltip */}
              {renderStatusBadge()}
              
              <UncontrolledTooltip placement="top" target={badgeId}>
                {task.rejection_reason || "No reason provided."}
              </UncontrolledTooltip>

                 {/* Submit Again Button */}
              {onVerifyClick && (
                 <div 
                 className="status-badge pending clickable" 
                 onClick={() => onVerifyClick(task)}
               >
                 Submit Again
               </div>
              )}
            </>
          ) : (
            renderStatusBadge()
          )}
        </div>
        <div className="review-status mt-1 text-end">
          {reviewText}
        </div>
      </div>
    </div>
  )
}
