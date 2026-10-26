import React from 'react'
import { Link } from 'react-router-dom'
import { Modal, ModalBody } from 'reactstrap'
import type { RestrictionReason } from '../../lib/auth/subscriptionUtils'
import { RESTRICTION_MESSAGES } from '../../config/accessRestriction'

interface RestrictedAccessModalProps {
  /** Why the menus are locked; the modal is closed while this is null. */
  reason: RestrictionReason | null
  isOpen: boolean
  onClose: () => void
}

/** Explains a locked menu or page to a restricted borrower (BUG-033). */
export default function RestrictedAccessModal({ reason, isOpen, onClose }: RestrictedAccessModalProps) {
  const content = reason ? RESTRICTION_MESSAGES[reason] : null

  return (
    <Modal isOpen={isOpen && !!content} toggle={onClose} centered labelledBy="restricted-access-title">
      {content && (
        <ModalBody className="text-center p-4">
          <div className="avatar-md mx-auto mb-3">
            <div className="avatar-title rounded-circle bg-warning-subtle text-warning fs-1">
              <i className={content.icon} aria-hidden="true"></i>
            </div>
          </div>
          <h5 id="restricted-access-title" className="mb-2">
            {content.title}
          </h5>
          <p className="text-muted mb-4">{content.message}</p>
          <div className="d-flex justify-content-center gap-2">
            <Link to="/invoices" className="btn btn-light" onClick={onClose}>
              View Invoices
            </Link>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Got it
            </button>
          </div>
        </ModalBody>
      )}
    </Modal>
  )
}
