import { toast } from 'react-toastify'
import { isEditConfirmationCancelled } from './editConfirmation'

export const SAVE_CANCELLED_MESSAGE = 'Your changes were not saved.'
export const VALIDATION_ERROR_MESSAGE = 'Please fix the highlighted fields and try again.'

type SaveFailureOptions = {
  /** Shown when the server sends no message (e.g. a network error). */
  fallbackMessage: string
  /** Puts the server's field errors on the form. */
  onFieldErrors?: (errors: Record<string, any>) => void
}

/**
 * What a funding application step shows when a save does not succeed. Every
 * save ends with a message - the borrower should never click Save and see
 * nothing:
 * - re-signature dialog cancelled -> "Your changes were not saved."
 * - validation error (422)        -> fields highlighted + a message
 * - anything else                 -> the server's message, or the step's own
 *
 * The fixed toast ids stop a duplicate when a tab switch and the Save button
 * fire the same save together.
 */
export function reportSaveFailure(error: any, { fallbackMessage, onFieldErrors }: SaveFailureOptions): void {
  if (isEditConfirmationCancelled(error)) {
    toast.info(SAVE_CANCELLED_MESSAGE, { toastId: 'funding-application-save-cancelled' })
    return
  }

  const errors = error?.response?.data?.errors
  if (errors && typeof errors === 'object') {
    onFieldErrors?.(errors)
    toast.error(VALIDATION_ERROR_MESSAGE, { toastId: 'funding-application-validation' })
    return
  }

  toast.error(error?.response?.data?.message || fallbackMessage)
}
