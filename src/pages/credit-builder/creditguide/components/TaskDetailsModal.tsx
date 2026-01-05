import React from 'react'
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap'
import { TierTask } from '../../../../modules/credit-builder/guide/types'


interface TaskDetailsModalProps {
  isOpen: boolean
  toggle: () => void
  task: TierTask | null
  logoSrc?: string | null
}

export default function TaskDetailsModal({ isOpen, toggle, task, logoSrc }: TaskDetailsModalProps) {
  if (!task) return null

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="md" contentClassName="border-0 overflow-hidden" className="task-details-modal">
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

             {/* Alert Box */}
             <div className="alert alert-warning d-flex align-items-start gap-2 border-0 rounded-3 mb-3 p-3 task-modal-alert">
                <i className="ri-alert-fill text-warning fs-5 mt-0"></i>
                <div className="text-dark task-modal-alert-text">
                   <strong>Important:</strong> Read these instructions carefully before proceeding.
                </div>
             </div>

             {/* Content - Compact Body Text */}
             <div className="task-content">
                {/* Demo Content from Image */}
                <div className="styled-content">
                    <h6 className="fw-bold mb-1 text-dark task-modal-section-title">Eligibility</h6>
                    <ul className="mb-3 text-dark ps-3 task-modal-list">
                        <li className="mb-1">It's recommended that your business is at least 30 days old.</li>
                        <li className="mb-1">Use your exact business legal name, address, and information when applying.</li>
                        <li className="mb-1">Orders should be consistent with normal business purchases; do not order luxury items, gift cards, or personal items.</li>
                    </ul>

                    <h6 className="fw-bold mb-1 text-dark task-modal-section-title">Ordering Guidelines</h6>
                    <ul className="mb-3 text-dark ps-3 task-modal-list">
                         <li className="mb-1">Place an initial order of at least $70 worth of shipping, packaging, or cleaning supplies.</li>
                         <li className="mb-1">Always make payments on <span className="fw-bold text-black">time</span> to build a positive payment history.</li>
                    </ul>

                    <h6 className="fw-bold mb-1 text-dark task-modal-section-title">Reporting Timeline</h6>
                    <ul className="mb-3 text-dark ps-3 task-modal-list">
                        <li className="mb-1">After making a <span className="fw-bold text-black">purchase</span>, reporting to bureaus typically occurs after two or more on-time payment cycles.</li>
                    </ul>

                    <hr className="my-3 opacity-25" />
                    
                    <p className="text-dark fst-italic mb-0 task-modal-footer-note">
                        Opening an account and making purchases does not guarantee credit reporting. Accounts are reviewed before reporting.
                    </p>
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

              <Button 
                className="px-3 text-dark fw-bold py-1 border-0 text-truncate task-modal-continue-btn" 
                onClick={() => {
                    if (task.url) {
                        window.open(task.url, '_blank')
                    }
                }}
              >
                  Continue to Website
              </Button>
          </div>
          <div className="text-end text-dark small mt-2 task-modal-important-note">
              IMPORTANT: You must use the link above to proceed.
          </div>
      </div>
    </Modal>
  )
}
