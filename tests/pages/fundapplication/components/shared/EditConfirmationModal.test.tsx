import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../../../test-utils'
import { server } from '../../../../mocks/server'
import EditConfirmationModal from '../../../../../src/pages/fundapplication/components/shared/EditConfirmationModal'
import { useSaveBusinessInfo } from '../../../../../src/modules/funding-application/queries'
import { isEditConfirmationCancelled } from '../../../../../src/modules/funding-application/editConfirmation'
import {
  useEditConfirmationStore,
  setEditRequiresConfirmation,
} from '../../../../../src/store/fundApplication/editConfirmationStore'

/**
 * The borrower-facing half of the re-signature rule.
 *
 * While the application is still being filled in for the first time there is no
 * signature to lose, so saving must be silent - a confirmation on every step of
 * a first pass would be noise. Once it has been signed and submitted, every
 * subsequent save asks first, because it withdraws that signature.
 *
 * Driven through the real mutation hook and the real apiClient against MSW, so
 * what is actually exercised is "does a request reach the server", which is the
 * only version of this that matters.
 */

const BUSINESS_INFO_URL = '*/borrower/funding-application/business-info'

/** A step's Save button, standing in for any of the six that save this way. */
function SaveHarness() {
  const { mutateAsync: save } = useSaveBusinessInfo()

  const onClick = async () => {
    try {
      await save({ business_name: 'Alpha Tech Solutions LLC' } as any)
    } catch (error) {
      // Mirrors what the real steps do: a cancellation is not a failure.
      if (!isEditConfirmationCancelled(error)) throw error
    }
  }

  return (
    <>
      <button type="button" onClick={onClick}>
        Save
      </button>
      <EditConfirmationModal />
    </>
  )
}

describe('EditConfirmationModal', () => {
  let requests: number

  beforeEach(() => {
    requests = 0
    server.use(
      http.post(BUSINESS_INFO_URL, () => {
        requests += 1
        return HttpResponse.json({ status: true, message: 'Saved', data: { id: 1 } })
      })
    )
  })

  afterEach(() => {
    useEditConfirmationStore.setState({ requiresConfirmation: false, isOpen: false, resolver: null })
  })

  it('stays out of the way while the application is being filled in for the first time', async () => {
    // Nothing signed yet: On Hold / Draft, so the API reports no resign cost.
    setEditRequiresConfirmation(false)

    renderWithProviders(<SaveHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(requests).toBe(1))
    expect(screen.queryByText(/needs a new signature/i)).not.toBeInTheDocument()
  })

  it('asks before changing an application that has already been submitted', async () => {
    setEditRequiresConfirmation(true)

    renderWithProviders(<SaveHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText(/needs a new signature/i)).toBeInTheDocument()
    expect(requests).toBe(0)
  })

  it('spells out what the borrower loses, not just that they are about to change something', async () => {
    setEditRequiresConfirmation(true)

    renderWithProviders(<SaveHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText(/withdraws that signature/i)).toBeInTheDocument()
    expect(screen.getByText(/will not continue through review until you sign it again/i)).toBeInTheDocument()
  })

  it('sends the save once the borrower accepts the consequence', async () => {
    setEditRequiresConfirmation(true)

    renderWithProviders(<SaveHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await userEvent.click(await screen.findByRole('button', { name: /save and sign again/i }))

    await waitFor(() => expect(requests).toBe(1))
    await waitFor(() => expect(screen.queryByText(/needs a new signature/i)).not.toBeInTheDocument())
  })

  it('sends nothing when the borrower keeps the application as submitted', async () => {
    setEditRequiresConfirmation(true)

    renderWithProviders(<SaveHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await userEvent.click(await screen.findByRole('button', { name: /keep it as submitted/i }))

    await waitFor(() => expect(screen.queryByText(/needs a new signature/i)).not.toBeInTheDocument())
    expect(requests).toBe(0)
  })

  it('asks again on the next edit, not just the first one', async () => {
    // A borrower correcting two things in a row is the common case; the second
    // correction costs a signature exactly as much as the first.
    setEditRequiresConfirmation(true)

    renderWithProviders(<SaveHarness />)

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await userEvent.click(await screen.findByRole('button', { name: /save and sign again/i }))
    await waitFor(() => expect(requests).toBe(1))

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText(/needs a new signature/i)).toBeInTheDocument()
    expect(requests).toBe(1)
  })
})
