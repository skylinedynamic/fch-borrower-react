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
          // Use a small timeout to let the hide animation finish before disposing.
          // It fires after unmount, so the host document can already be gone
          // (a torn-down test environment) — bail out instead of throwing.
          setTimeout(() => {
            if (typeof document === 'undefined') return
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
        <div className="modal-content">
          <div className="modal-body p-5 text-center">
            {iconClass ? (
              <div className="avatar-xl mx-auto mb-3">
                <span className={`avatar-title ${iconBgClass || 'bg-danger-subtle'} ${iconTextClass || 'text-danger'} rounded-circle fs-48`}>
                  <i className={iconClass}></i>
                </span>
              </div>
            ) : (
              <div className="mx-auto mb-4">
                <lord-icon
                  src={icon}
                  trigger="loop"
                  colors={iconColors || 'primary:#121331,secondary:#08a88a'}
                  style={{ width: '90px', height: '90px' }}
                ></lord-icon>
              </div>
            )}
            <div className="mt-2 text-center">
              <h4>{title}</h4>
              <p className="text-muted fs-15 mb-4">
                {message}
              </p>
              <div className="hstack gap-2 justify-content-center">
                <button
                  type="button"
                  className="btn btn-light fw-medium"
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
