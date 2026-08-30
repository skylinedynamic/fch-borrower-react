import React from 'react'
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap'
import { TierTask } from '../../../../modules/credit-builder/guide/types'
import { CREDIT_BUILDER_STATUS } from '../../../../data/credit-builder'


interface TaskDetailsModalProps {
  isOpen: boolean
  toggle: () => void
  task: TierTask | null
  logoSrc?: string | null
  onVerifyClick?: (task: TierTask) => void
}

export default function TaskDetailsModal({ isOpen, toggle, task, logoSrc, onVerifyClick }: TaskDetailsModalProps) {
  if (!task) return null
  
  const isDone = task.status === CREDIT_BUILDER_STATUS.VERIFIED
  const isProcessing = task.status === CREDIT_BUILDER_STATUS.PROCESSING
  const isRejected = task.status === CREDIT_BUILDER_STATUS.REJECTED

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg" contentClassName="border-0 overflow-hidden" className="task-details-modal">
       {/* Customized Header with Gradient Background */}
       <div className="modal-header border-0 pb-0">
            <div className="w-100">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="modal-title mb-0 fw-bold text-white fs-6">{task.title} Instructions</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={toggle} aria-label="Close"></button>
                </div>
                <div className="opacity-75 mb-3 text-white task-modal-subtitle">
                    {task.subtitle ? `${task.subtitle} | ` : ''} Vendor eligibility reviewed by FCH underwriting
                </div>
            </div>
      </div>

      <ModalBody className="p-0">
         <div className="p-4">
            {/* Logo Section - Centered & Compact */}
             <div className="text-center mb-3">
                <div className="d-flex align-items-center justify-content-center gap-2">
                     {logoSrc && (
                        <img src={logoSrc} alt={task.title} className="task-modal-logo" />
                     )}
                     <h5 className="mb-0 fw-bold text-dark">{task.title} Instructions</h5>
                </div>
                <div className="text-dark mt-1 fw-medium task-modal-logo-subtitle">
                     {task.subtitle ? `${task.subtitle} | ` : ''} Vendor eligibility reviewed by FCH underwriting
                </div>
             </div>

             {/* Content - Compact Body Text */}
             <div className="task-content">
                <div className="styled-content">
                    {/* Description */}
                    {task.vendor?.description && (
                        <div 
                            className="mb-3 text-dark task-modal-description"
                            dangerouslySetInnerHTML={{ __html: task.vendor.description }}
                        />
                    )}

                     <hr className="my-3 opacity-25" />

                    <div className="d-flex gap-3 align-items-start flex-wrap">
                        {/* Eligibility / Requirements */}
                        {task.vendor?.requirements && task.vendor.requirements.length > 0 && (
                            <div className="flex-fill">
                                <h6 className="fw-bold mb-1 text-dark task-modal-section-title">Eligibility</h6>
                                <ul className="mb-3 text-dark ps-3 task-modal-list">
                                    {task.vendor.requirements.map((req, idx) => (
                                        <li key={idx} className="mb-1">{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Benefits */}
                        {task.vendor?.benefits && task.vendor.benefits.length > 0 && (
                            <div className="flex-fill">
                                <h6 className="fw-bold mb-1 text-dark task-modal-section-title">Benefits</h6>
                                <ul className="mb-3 text-dark ps-3 task-modal-list">
                                    {task.vendor.benefits.map((benefit, idx) => (
                                        <li key={idx} className="mb-1">{benefit}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Reporting To */}
                        {task.vendor?.report_to && task.vendor.report_to.length > 0 && (
                             <div className="flex-fill">
                                <h6 className="fw-bold mb-1 text-dark task-modal-section-title">Reporting Timeline</h6>
                                <ul className="mb-3 text-dark ps-3 task-modal-list">
                                    {task.vendor.report_to.map((report, idx) => (
                                        <li key={idx} className="mb-1">{report}</li>
                                    ))}
                                </ul>
                             </div>
                        )}
                    </div>
             
                </div>
             </div>
         </div>
      </ModalBody>

      {/* Footer Actions */}
      <div className="modal-footer border-0 d-block p-3 bg-light bg-opacity-10">
          <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
              <Button 
                color="light" 
                className="border px-3 py-1 flex-shrink-0 task-modal-back-btn"
                onClick={toggle}
              >
                  <i className="ri-arrow-left-line me-1"></i> Back
              </Button>

              <div className="d-flex gap-2">
                 {!isDone && !isProcessing && onVerifyClick && (
                     <Button 
                        color="primary"
                        className="px-3 py-1 border-0 text-truncate"
                        onClick={() => {
                            onVerifyClick(task)
                            toggle()
                        }}
                      >
                          {isRejected ? 'Submit Again' : 'Submit for Verification'}
                      </Button>
                 )}

                  <Button 
                    className="px-3 text-dark fw-bold py-1 border-0 text-truncate task-modal-continue-btn" 
                    onClick={() => {
                        const targetUrl = task.vendor?.affiliate_url || task.vendor?.general_url
                        if (targetUrl) {
                            window.open(targetUrl, '_blank')
                        }
                    }}
                  >
                      Continue to Website
                  </Button>
              </div>
          </div>
          <div className="text-end text-dark small mt-2 task-modal-important-note">
              IMPORTANT: You must use the link above to proceed.
          </div>
      </div>
    </Modal>
  )
}
