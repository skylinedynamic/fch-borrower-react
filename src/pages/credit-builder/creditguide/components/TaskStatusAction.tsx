import React from 'react'
import { UncontrolledTooltip } from 'reactstrap'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'
import type { TierTask } from '../../../../modules/credit-builder/guide/types'

interface TaskStatusActionProps {
  task: TierTask
  /** Whether the borrower can submit tasks on this tier yet. */
  canSubmit: boolean
  onSubmit?: (task: TierTask) => void
}

/**
 * The right-hand side of a step: a submit button while the task is waiting on
 * the borrower, otherwise a status pill (with the reviewer's note on hover).
 */
export default function TaskStatusAction({ task, canSubmit, onSubmit }: TaskStatusActionProps) {
  const pillId = `task-status-${task.id}`

  if (task.status === CREDIT_BUILDER_STATUS.VERIFIED) {
    return (
      <>
        <span id={pillId} className="cg-pill is-verified">
          <i className="ri-checkbox-circle-fill" aria-hidden="true"></i> Verified
        </span>
        <UncontrolledTooltip placement="top" target={pillId}>
          {task.note || 'No note provided.'}
        </UncontrolledTooltip>
      </>
    )
  }

  if (task.status === CREDIT_BUILDER_STATUS.PROCESSING) {
    return (
      <span className="cg-pill is-review">
        <i className="ri-loader-4-line spin-animation" aria-hidden="true"></i> In Review
      </span>
    )
  }

  if (task.status === CREDIT_BUILDER_STATUS.REJECTED) {
    return (
      <div className="cg-actions">
        <span id={pillId} className="cg-pill is-rejected">
          <i className="ri-close-circle-fill" aria-hidden="true"></i> Rejected
        </span>
        <UncontrolledTooltip placement="top" target={pillId}>
          {task.note || 'No note provided.'}
        </UncontrolledTooltip>
        {onSubmit && (
          <button type="button" className="cg-btn cg-btn-outline" onClick={() => onSubmit(task)}>
            <i className="ri-refresh-line" aria-hidden="true"></i> Submit Again
          </button>
        )}
      </div>
    )
  }

  if (canSubmit && onSubmit) {
    return (
      <button type="button" className="cg-btn cg-btn-primary" onClick={() => onSubmit(task)}>
        <i className="ri-send-plane-fill" aria-hidden="true"></i>
        {task.button_title || 'Submit for Verification'}
      </button>
    )
  }

  return (
    <span className="cg-pill is-pending">
      <i className="ri-time-line" aria-hidden="true"></i> Pending
    </span>
  )
}
