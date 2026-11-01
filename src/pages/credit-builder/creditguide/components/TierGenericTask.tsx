import React from 'react'
import { TierTask as TierTaskType } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'
import TaskStatusAction from './TaskStatusAction'

export interface TierGenericTaskProps {
  task: TierTaskType
  isCurrentTier?: boolean
  isFirstTier?: boolean
  onTaskClick?: (task: TierTaskType) => void
  onVerifyClick?: (task: TierTaskType) => void
  tierId?: number
  index?: number
  tierDescription?: string | null
}

export default function TierGenericTask({ task, isCurrentTier, isFirstTier, onVerifyClick, index, tierDescription }: TierGenericTaskProps) {
  const isDone = task.status === CREDIT_BUILDER_STATUS.VERIFIED
  const isProcessing = task.status === CREDIT_BUILDER_STATUS.PROCESSING
  const isRejected = task.status === CREDIT_BUILDER_STATUS.REJECTED
  const state = isDone ? 'is-verified' : isProcessing ? 'is-review' : isRejected ? 'is-rejected' : 'is-pending'

  let reviewText
  if (isDone) {
    reviewText = task.completed_at ? `Verified by FCH on ${task.completed_at}` : 'Verified by FCH'
  } else if (isProcessing) {
    reviewText = 'Verification in progress'
  } else if (isRejected) {
    reviewText = 'Verification rejected'
  } else {
    reviewText = 'Reviewed by FCH underwriting'
  }

  return (
    <>
      {/* Tier Description - Only for first item */}
      {index === 0 && tierDescription && (
        <div className="cg-tier-note" dangerouslySetInnerHTML={{ __html: tierDescription }} />
      )}

      <div className={`cg-step ${state}`} data-task={task.id}>
        <div className="cg-step-marker" aria-hidden="true">
          {isDone ? (
            <i className="ri-check-line"></i>
          ) : isProcessing ? (
            <i className="ri-time-line"></i>
          ) : isRejected ? (
            <i className="ri-close-line"></i>
          ) : (
            <span>{typeof index === 'number' ? index + 1 : ''}</span>
          )}
        </div>

        <div className="cg-step-body">
          <div className="cg-step-title">{task.title}</div>
          {task.subtitle && <div className="cg-step-subtitle">{task.subtitle}</div>}
          <div className="cg-step-review">{reviewText}</div>
          {/* The reviewer's reason, in view rather than only on hover (BUG-083). */}
          {isRejected && task.note && <div className="cg-step-reason">Reason: {task.note}</div>}
        </div>

        <div className="cg-step-action">
          <TaskStatusAction task={task} canSubmit={!!(isFirstTier || isCurrentTier)} onSubmit={onVerifyClick} />
        </div>
      </div>
    </>
  )
}
