import React from 'react'
import { Modal, ModalBody } from 'reactstrap'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'
import type { TierTask } from '../../../../modules/credit-builder/guide/types'

interface VerifyTasksModalProps {
  /** The tasks to submit; null keeps the modal closed. */
  tasks: TierTask[] | null
  tierName: string
  submitting: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Confirms submitting one task, or several at once ("Verify All"), for verification. */
export default function VerifyTasksModal({ tasks, tierName, submitting, onConfirm, onClose }: VerifyTasksModalProps) {
  const count = tasks?.length ?? 0
  const bulk = count > 1

  return (
    <Modal
      isOpen={count > 0}
      toggle={submitting ? undefined : onClose}
      centered
      size="md"
      backdrop="static"
      contentClassName="cg-modal"
      labelledBy="cg-verify-title"
    >
      <ModalBody className="p-0">
        <div className="cg-modal-head">
          <span className="cg-modal-icon" aria-hidden="true">
            <i className={bulk ? 'ri-checkbox-multiple-line' : 'ri-shield-check-line'}></i>
          </span>
          <div className="min-w-0">
            <div className="cg-modal-eyebrow">{tierName}</div>
            <h5 id="cg-verify-title" className="cg-modal-title">
              {bulk ? `Submit ${count} tasks for verification` : 'Submit for verification'}
            </h5>
          </div>
          <button type="button" className="cg-modal-close" onClick={onClose} disabled={submitting} aria-label="Close">
            <i className="ri-close-line" aria-hidden="true"></i>
          </button>
        </div>

        <div className="cg-modal-body">
          <p className="cg-modal-text">
            {bulk
              ? 'These tasks will be sent to underwriting together. Make sure each one is done before you submit.'
              : 'This task will be sent to underwriting for review. Make sure it is done before you submit.'}
          </p>

          <ul className="cg-modal-list">
            {tasks?.map((task) => (
              <li key={task.id}>
                <i className="ri-checkbox-circle-line" aria-hidden="true"></i>
                <span className="min-w-0">
                  <span className="cg-modal-task">{task.title}</span>
                  {task.status === CREDIT_BUILDER_STATUS.REJECTED && (
                    <span className="cg-modal-tag">Resubmission</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="cg-modal-note">
            <i className="ri-information-line" aria-hidden="true"></i>
            <span>
              You'll see {bulk ? 'each task' : 'it'} as <strong>In Review</strong> until it's verified.
            </span>
          </div>
        </div>

        <div className="cg-modal-foot">
          <button type="button" className="cg-btn cg-btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="cg-btn cg-btn-primary" onClick={onConfirm} disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Submitting...
              </>
            ) : bulk ? (
              `Submit ${count} tasks`
            ) : (
              'Submit for Verification'
            )}
          </button>
        </div>
      </ModalBody>
    </Modal>
  )
}
