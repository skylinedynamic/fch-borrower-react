import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

import { toast } from 'react-toastify'
import { EditConfirmationCancelled } from '../../../src/modules/funding-application/editConfirmation'
import {
  reportSaveFailure,
  SAVE_CANCELLED_MESSAGE,
  STALE_APPLICATION_MESSAGE,
  STALE_APPLICATION_TOAST_ID,
  VALIDATION_ERROR_MESSAGE,
} from '../../../src/modules/funding-application/saveFeedback'
import { render, screen } from '@testing-library/react'

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

  /**
   * Defect: R2 BUG-033 - a save from a tab showing an older copy overwrote
   * the newer one. The API now refuses it (409); the borrower is told why and
   * offered a reload, and the toast stays until they act on it.
   */
  it('says the application changed elsewhere and offers a reload when the save came from an older copy', () => {
    const onFieldErrors = vi.fn()
    const message = 'This application was changed in another tab or by someone else since you opened it. Reload to see the latest before saving.'

    reportSaveFailure({ response: { status: 409, data: { message, errors: { version: 'x' } } } }, { fallbackMessage: 'Failed to save', onFieldErrors })

    expect(onFieldErrors).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledTimes(1)
    const [content, options] = (toast.error as any).mock.calls[0]
    expect(options).toMatchObject({ toastId: STALE_APPLICATION_TOAST_ID, autoClose: false })

    render(content)
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
  })

  it('falls back to its own words for a 409 without a message', () => {
    reportSaveFailure({ response: { status: 409, data: {} } }, { fallbackMessage: 'Failed to save' })

    render((toast.error as any).mock.calls[0][0])
    expect(screen.getByText(STALE_APPLICATION_MESSAGE)).toBeInTheDocument()
  })

  it('falls back to the step message when the server gives none (network error)', () => {
    reportSaveFailure(new Error('Network Error'), { fallbackMessage: 'Failed to save disclosures' })

    expect(toast.error).toHaveBeenCalledWith('Failed to save disclosures')
  })
})
