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
  children?: React.ReactNode
  hideIcon?: boolean
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
  children,
  hideIcon = false,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const modalInstanceRef = useRef<Modal | null>(null)

  const cleanupModalEffects = () => {
    // Scheduled below via setTimeout(..., 100/300) from the unmount cleanup,
    // uncancelled - if the page (or, in tests, jsdom) is torn down before
    // those fire, `document` is already gone by the time this callback runs.
    if (typeof document === 'undefined') return

    // Bail out while any modal is still open. This used to remove every
    // .modal-backdrop in the document, which also took out overlays belonging to
    // other modals - the profile completion modal is mounted globally, so on any
    // page that renders this component its overlay was stripped and the page
    // behind it showed undimmed. Only stray backdrops are cleared now.
    if (document.querySelector('.modal.show')) return

    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove())
    document.body.classList.remove('modal-open')
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }

  // Initialize Bootstrap Modal instance once
  useEffect(() => {
    if (!modalRef.current) return
    if (!modalInstanceRef.current) {
      modalInstanceRef.current = new Modal(modalRef.current, {
        backdrop: 'static',
        keyboard: false,
      })
    }

    const modalEl = modalRef.current
    const handleHidden = () => {
      cleanupModalEffects()
    }
    modalEl?.addEventListener('hidden.bs.modal', handleHidden)

    return () => {
      modalEl?.removeEventListener('hidden.bs.modal', handleHidden)
      const modal = modalInstanceRef.current
      if (modal) {
        try {
          modal.hide()
          if (typeof modal.dispose === 'function') modal.dispose()
        } catch (_) { }
      }
      modalInstanceRef.current = null
      cleanupModalEffects()
      setTimeout(cleanupModalEffects, 100)
      setTimeout(cleanupModalEffects, 300)
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
      setTimeout(cleanupModalEffects, 150)
      setTimeout(cleanupModalEffects, 350)
    }
  }, [show])

  const modalContent = (
    <div
      className="modal fade flip"
      ref={modalRef}
      tabIndex={-1}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          {hideIcon && (
            <div className="modal-header justify-content-center border-bottom bg-light py-3">
              <h4 className="modal-title mb-0">{title}</h4>
            </div>
          )}
          <div className={`modal-body text-center ${hideIcon ? 'px-5 pt-3 pb-4' : 'p-5'}`}>
            {hideIcon ? null : iconClass ? (
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
              {!hideIcon && <h4>{title}</h4>}
              {message && (
                <p className="text-muted fs-15 mb-4">
                  {message}
                </p>
              )}
              {children}
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
