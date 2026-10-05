import { Modal, ModalBody, ModalFooter } from 'reactstrap'
import {
  useEditConfirmationStore,
  resolveEditConfirmation,
} from '../../../../store/fundApplication/editConfirmationStore'
import '../../../../../assets/css/edit-confirmation-modal.css'

/**
 * Shown the moment a borrower tries to save a change to an application they
 * have already signed and submitted.
 *
 * The point is the consequence, not the permission: saving is allowed, but it
 * withdraws the signature and takes the application out of review until they
 * sign again. Said plainly up front, that is a decision; discovered afterwards,
 * it reads like the application was rejected.
 *
 * The two buttons name outcomes rather than "Cancel" and "OK", so neither can
 * be clicked without having read what it does.
 *
 * Rendered once by the wizard; which save it is answering for is held in the
 * store, so every save path gets the same dialog. `fade` is off because the
 * stylesheet animates it instead.
 */
export default function EditConfirmationModal() {
  const isOpen = useEditConfirmationStore(state => state.isOpen)

  return (
    <Modal
      isOpen={isOpen}
      toggle={() => resolveEditConfirmation(false)}
      centered
      fade={false}
      backdrop="static"
      modalClassName="edit-confirmation-modal"
      aria-labelledby="edit-confirmation-title"
    >
      <ModalBody className="p-4">
        <div className="d-flex gap-3">
          <div className="flex-shrink-0">
            <span className="edit-confirmation-icon">
              <i className="ri-error-warning-fill" aria-hidden="true"></i>
            </span>
          </div>
          <div>
            <h5 id="edit-confirmation-title" className="edit-confirmation-title mb-2">
              This change needs a new signature
            </h5>
            <p className="text-muted mb-2">
              You have already signed and submitted this application. Saving this change withdraws
              that signature, because it no longer covers what is on the application.
            </p>
            <p className="text-muted mb-0">
              Your application will move back to{' '}
              <span className="edit-confirmation-status">Draft</span> and will not continue through
              review until you sign it again on the final step.
            </p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          className="btn btn-light"
          onClick={() => resolveEditConfirmation(false)}
        >
          Keep it as submitted
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => resolveEditConfirmation(true)}
        >
          Save and sign again
        </button>
      </ModalFooter>
    </Modal>
  )
}
