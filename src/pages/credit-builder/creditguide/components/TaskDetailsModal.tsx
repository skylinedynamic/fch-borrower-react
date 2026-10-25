import React from 'react'
import { Modal, ModalBody } from 'reactstrap'
import { TierTask } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'

interface TaskDetailsModalProps {
  isOpen: boolean
  toggle: () => void
  task: TierTask | null
  logoSrc?: string | null
  onVerifyClick?: (task: TierTask) => void
}

interface DetailListProps {
  title: string
  icon: string
  items?: string[]
}

function DetailList({ title, icon, items }: DetailListProps) {
  if (!items || items.length === 0) return null
  return (
    <div className="cg-detail">
      <h3 className="cg-detail-title">
        <i className={icon} aria-hidden="true"></i> {title}
      </h3>
      <ul className="cg-detail-list">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default function TaskDetailsModal({ isOpen, toggle, task, logoSrc, onVerifyClick }: TaskDetailsModalProps) {
  if (!task) return null

  const isDone = task.status === CREDIT_BUILDER_STATUS.VERIFIED
  const isProcessing = task.status === CREDIT_BUILDER_STATUS.PROCESSING
  const isRejected = task.status === CREDIT_BUILDER_STATUS.REJECTED
  const websiteUrl = task.vendor?.affiliate_url || task.vendor?.general_url

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      centered
      size="lg"
      contentClassName="cg-modal"
      className="task-details-modal"
      labelledBy="cg-details-title"
    >
      <ModalBody className="p-0">
        <div className="cg-modal-head">
          {logoSrc ? (
            <span className="cg-modal-logo">
              <img src={logoSrc} alt="" />
            </span>
          ) : (
            <span className="cg-modal-icon" aria-hidden="true">
              <i className="ri-store-2-line"></i>
            </span>
          )}
          <div className="min-w-0">
            <div className="cg-modal-eyebrow">
              {task.subtitle ? `${task.subtitle} · ` : ''}Vendor eligibility reviewed by FCH underwriting
            </div>
            <h5 id="cg-details-title" className="cg-modal-title">
              {task.title} Instructions
            </h5>
          </div>
          <button type="button" className="cg-modal-close" onClick={toggle} aria-label="Close">
            <i className="ri-close-line" aria-hidden="true"></i>
          </button>
        </div>

        <div className="cg-modal-body cg-details-body">
          {task.vendor?.description && (
            <div className="cg-details-description" dangerouslySetInnerHTML={{ __html: task.vendor.description }} />
          )}

          <div className="cg-details-grid">
            <DetailList title="Eligibility" icon="ri-shield-check-line" items={task.vendor?.requirements} />
            <DetailList title="Benefits" icon="ri-gift-line" items={task.vendor?.benefits} />
            <DetailList title="Reporting Timeline" icon="ri-calendar-check-line" items={task.vendor?.report_to} />
          </div>
        </div>

        <div className="cg-details-foot">
          <div className="cg-details-actions">
            <button type="button" className="cg-btn cg-btn-ghost" onClick={toggle}>
              <i className="ri-arrow-left-line" aria-hidden="true"></i> Back
            </button>

            <div className="cg-actions">
              {!isDone && !isProcessing && onVerifyClick && (
                <button
                  type="button"
                  className="cg-btn cg-btn-outline"
                  onClick={() => {
                    onVerifyClick(task)
                    toggle()
                  }}
                >
                  <i className="ri-send-plane-fill" aria-hidden="true"></i>
                  {isRejected ? 'Submit Again' : 'Submit for Verification'}
                </button>
              )}

              <button
                type="button"
                className="cg-btn cg-btn-primary"
                onClick={() => {
                  if (websiteUrl) window.open(websiteUrl, '_blank')
                }}
              >
                Continue to Website <i className="ri-external-link-line" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div className="cg-modal-note">
            <i className="ri-information-line" aria-hidden="true"></i>
            <span>
              <strong>Important:</strong> you must use the link above to proceed.
            </span>
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}
