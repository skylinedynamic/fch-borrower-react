import React from 'react'
import { TierTask as TierTaskType } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'

export interface TierTaskProps {
  task: TierTaskType
  isCurrentTier?: boolean
  isFirstTier?: boolean
  onTaskClick?: (task: TierTaskType) => void
  onVerifyClick?: (task: TierTaskType) => void
}

export default function TierTask({ task, isCurrentTier, isFirstTier, onTaskClick, onVerifyClick }: TierTaskProps) {
  const isDone = task.status === CREDIT_BUILDER_STATUS.COMPLETED
  const isProcessing = task.status === CREDIT_BUILDER_STATUS.PROCESSING
  
  // For first tier pending tasks, they should be clickable for verification
  const isClickableForVerification = isFirstTier && !isDone && !isProcessing
  // For other tiers, existing clickability logic
  const isClickableForNavigation = !isDone && !isProcessing && isCurrentTier && !isFirstTier
  
  const isClickable = isClickableForVerification || isClickableForNavigation
  
  let statusIcon
  if (isDone) {
    statusIcon = <i className="ri-check-line"></i>
  } else if (isProcessing) {
    statusIcon = <i className="ri-loader-4-line spin-animation"></i>
  } else {
    statusIcon = <span>I</span>
  }

  let statusText
  if (isDone) {
    statusText = 'Completed'
  } else if (isProcessing) {
    statusText = 'Processing'
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
  } else {
    reviewText = 'Reviewed by FCH underwriting'
  }
  
  return (
    <div className="tier-task-item">
      <div className="d-flex gap-3 align-items-start flex-grow-1">
        {/* Icon Box */}
        <div className="task-icon-col">
          <div className={`task-status-icon ${isDone ? 'completed-icon' : isProcessing ? 'processing-icon' : 'pending-icon'}`}>
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
        <div 
          className={`status-badge ${isDone ? 'completed' : isProcessing ? 'processing' : 'pending'} ${isClickable ? 'clickable' : ''}`}
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
        <div className="review-status mt-1">
          {reviewText}
        </div>
      </div>
    </div>
  )
}
