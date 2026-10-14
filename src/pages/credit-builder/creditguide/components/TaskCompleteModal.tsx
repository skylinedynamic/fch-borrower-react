import React, { useEffect, useRef } from 'react'
import Modal from 'bootstrap/js/dist/modal'
import { hideAndDisposeModal } from '../../../../utils/bootstrapModal'

interface TaskCompleteModalProps {
  show: boolean
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
  text?: string
  title?: string
}

export default function TaskCompleteModal({ 
  show, 
  onConfirm, 
  onClose, 
  loading = false, 
  text,
  title
}: TaskCompleteModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const modalInstanceRef = useRef<Modal | null>(null)

  // Initialize Bootstrap Modal instance once
  useEffect(() => {
    if (!modalRef.current) return
    if (!modalInstanceRef.current) {
      modalInstanceRef.current = new Modal(modalRef.current, {
        backdrop: 'static',
        keyboard: false,
      })
    }
  }, [])

  // Show/hide based on show prop
  useEffect(() => {
    const modal = modalInstanceRef.current
    if (!modal) return
    if (show) {
      modal.show()
    } else {
      modal.hide()
    }
  }, [show])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const modal = modalInstanceRef.current
      // Not hide()+dispose() back to back: that races the hide animation (E2E-018).
      hideAndDisposeModal(modal, modalRef.current)
      modalInstanceRef.current = null
    }
  }, [])

  return (
    <div
      className="modal fade flip"
      ref={modalRef}
      tabIndex={-1}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body p-5 text-center">
            <lord-icon
              src="https://cdn.lordicon.com/lupuorrc.json"
              trigger="loop"
              colors="primary:#121331,secondary:#08a88a"
              style={{ width: '90px', height: '90px' }}
            ></lord-icon>
            <div className="mt-4 text-center">
              <h4>{title || "Confirm Completion"}</h4>
              <p className="text-muted fs-15 mb-4">
                {text || "Are you sure you want to mark this task as completed?"}
              </p>
              <div className="hstack gap-2 justify-content-center remove">
                <button
                  className="btn btn-link link-secondary fw-medium"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={onConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Updating...
                    </>
                  ) : (
                    'Yes, Complete It'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
