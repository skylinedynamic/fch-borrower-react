import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

import { toast } from 'react-toastify'
import { EditConfirmationCancelled } from '../../../src/modules/funding-application/editConfirmation'
import {
  reportSaveFailure,
  SAVE_CANCELLED_MESSAGE,
  VALIDATION_ERROR_MESSAGE,
} from '../../../src/modules/funding-application/saveFeedback'

/**
 * Every save on a funding application step ends with a message.
 *
 * Defect: two outcomes said nothing - the borrower cancelling the "this will
 * need a new signature" dialog, and a validation error (422) on the business,
 * ownership, financial and funding request steps, which only highlighted
 * fields. The borrower clicked Save and saw no message either way.
 */
describe('reportSaveFailure', () => {
  afterEach(() => vi.clearAllMocks())

  it('says the changes were not saved when the re-signature dialog is cancelled', () => {
    const onFieldErrors = vi.fn()

    reportSaveFailure(new EditConfirmationCancelled(), { fallbackMessage: 'Failed to save', onFieldErrors })

    expect(toast.info).toHaveBeenCalledWith(SAVE_CANCELLED_MESSAGE, expect.anything())
    expect(toast.error).not.toHaveBeenCalled()
    expect(onFieldErrors).not.toHaveBeenCalled()
  })

  it('highlights the fields and shows a message for a validation error', () => {
    const errors = { business_name: ['The business name field is required.'] }
    const onFieldErrors = vi.fn()

    reportSaveFailure(
      { response: { status: 422, data: { message: 'The business name field is required.', errors } } },
      { fallbackMessage: 'Failed to save', onFieldErrors }
    )

    expect(onFieldErrors).toHaveBeenCalledWith(errors)
    expect(toast.error).toHaveBeenCalledWith(VALIDATION_ERROR_MESSAGE, expect.anything())
  })

  it('shows the server message for any other failure', () => {
    reportSaveFailure({ response: { status: 500, data: { message: 'Server down' } } }, { fallbackMessage: 'Failed to save' })

    expect(toast.error).toHaveBeenCalledWith('Server down')
  })

  it('falls back to the step message when the server gives none (network error)', () => {
    reportSaveFailure(new Error('Network Error'), { fallbackMessage: 'Failed to save disclosures' })

    expect(toast.error).toHaveBeenCalledWith('Failed to save disclosures')
  })
})
