import React from 'react'
import { Link } from 'react-router-dom'
import { Modal, ModalBody } from 'reactstrap'

/** What verifying Tier 0 opens up, said once it has been submitted. */
const TIER_0_UNLOCKS = [
  { icon: 'ri-bank-card-line', title: 'Credit Card Stacking unlocks', text: 'Card strategies matched to your credit profile.' },
  { icon: 'ri-store-2-line', title: 'Tier 1 vendors unlock', text: 'Starter vendor accounts that report to the bureaus.' },
] as const

interface Tier0SubmittedModalProps {
  /** How many tasks were just submitted; 0 keeps the modal closed. */
  count: number
  tierName: string
  /** The walkthrough's next step, when submitting moved it on. */
  nextStep?: { label: string; route: string } | null
  onClose: () => void
}

/**
 * After one or more Tier 0 tasks are submitted: it worked, our team verifies
 * them and tells the borrower, and what verifying Tier 0 unlocks.
 */
export default function Tier0SubmittedModal({ count, tierName, nextStep, onClose }: Tier0SubmittedModalProps) {
  const one = count === 1

  return (
    <Modal
      isOpen={count > 0}
      toggle={onClose}
      centered
      size="md"
      contentClassName="cg-modal"
      labelledBy="cg-submitted-title"
    >
      <ModalBody className="p-0">
        <div className="cg-modal-head">
          <span className="cg-modal-icon" aria-hidden="true">
            <i className="ri-checkbox-circle-line"></i>
          </span>
          <div className="min-w-0">
            <div className="cg-modal-eyebrow">{tierName}</div>
            <h5 id="cg-submitted-title" className="cg-modal-title">
              Submitted successfully
            </h5>
          </div>
          <button type="button" className="cg-modal-close" onClick={onClose} aria-label="Close">
            <i className="ri-close-line" aria-hidden="true"></i>
          </button>
        </div>

        <div className="cg-modal-body">
          <p className="cg-modal-text">
            {one ? 'Your task has been submitted.' : `Your ${count} tasks have been submitted.`} Our team will verify{' '}
            {one ? 'it' : 'them'} and let you know.
          </p>

          <div className="cg-submitted-unlocks">
            <div className="cg-submitted-unlocks-title">Once all your Tier 0 tasks are verified</div>
            <ul className="cg-submitted-list">
              {TIER_0_UNLOCKS.map((unlock) => (
                <li key={unlock.title}>
                  <span className="cg-submitted-icon" aria-hidden="true">
                    <i className={unlock.icon}></i>
                  </span>
                  <span className="min-w-0">
                    <span className="cg-submitted-item-title">{unlock.title}</span>
                    <span className="cg-submitted-item-text">{unlock.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="cg-modal-foot">
          <button
            type="button"
            className={`cg-btn ${nextStep ? 'cg-btn-ghost' : 'cg-btn-primary'}`}
            onClick={onClose}
          >
            Got it
          </button>
          {nextStep && (
            <Link to={nextStep.route} className="cg-btn cg-btn-primary" onClick={onClose}>
              {nextStep.label} <i className="ri-arrow-right-line" aria-hidden="true"></i>
            </Link>
          )}
        </div>
      </ModalBody>
    </Modal>
  )
}
