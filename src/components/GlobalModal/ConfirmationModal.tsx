import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Modal from 'bootstrap/js/dist/modal'

interface ConfirmationModalProps {
  show: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  loadingText?: string
  icon?: string
  iconColors?: string
  confirmBtnClass?: string
  iconClass?: string
  iconBgClass?: string
  iconTextClass?: string
}

export default function ConfirmationModal({
  show,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  loadingText = 'Processing...',
  icon = 'https://cdn.lordicon.com/lupuorrc.json',
  iconColors = 'primary:#121331,secondary:#08a88a',
  confirmBtnClass = 'btn-primary',
  iconClass,
  iconBgClass = 'bg-danger-subtle',
  iconTextClass = 'text-danger',
}: ConfirmationModalProps) {
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
      if (modal) {
        try {
          modal.hide()
          // Use a small timeout to let the hide animation finish before disposing
          setTimeout(() => {
            if (typeof modal.dispose === 'function') modal.dispose()
          }, 300)
        } catch (_) { }
      }
      modalInstanceRef.current = null
    }
  }, [])

  const modalContent = (
    <div
      className="modal fade flip"
      ref={modalRef}
      tabIndex={-1}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-1 overflow-hidden">
          <div className="modal-body p-4 text-center">
            <div className="avatar-xl mx-auto mb-3">
              <span className={`avatar-title ${iconBgClass || 'bg-danger-subtle'} ${iconTextClass || 'text-danger'} rounded-circle fs-48`}>
                <i className={iconClass || 'ri-error-warning-line'}></i>
              </span>
            </div>
            <div className="mt-3 text-center">
              <h4 className="fs-18 fw-bold text-dark mb-2">{title}</h4>
              <p className="text-muted fs-14 mb-4 lh-base px-2">
                {message}
              </p>
              <div className="hstack gap-2 justify-content-center">
                <button
                  type="button"
                  className="btn btn-light fw-medium px-3"
                  onClick={onClose}
                  disabled={loading}
                >
                  <i className="ri-close-line me-1 align-middle"></i> {cancelText}
                </button>
                <button
                  type="button"
                  className={`btn ${confirmBtnClass} px-3`}
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
                      {loadingText}
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
