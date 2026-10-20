import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../../mocks/server'
import { createTestQueryClient } from '../../../../test-utils'
import DisclosuresStep from '../../../../../src/pages/fundapplication/components/steps/DisclosuresStep'
import { disclosureItems, type DisclosureConsent } from '../../../../../src/pages/fundapplication/types'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

import { toast } from 'react-toastify'
import { SAVE_CANCELLED_MESSAGE } from '../../../../../src/modules/funding-application/saveFeedback'
import {
  useEditConfirmationStore,
  setEditRequiresConfirmation,
  resolveEditConfirmation,
} from '../../../../../src/store/fundApplication/editConfirmationStore'

const resetConfirmation = () =>
  useEditConfirmationStore.setState({
    requiresConfirmation: false,
    isResolving: false,
    promptOnOpen: null,
    hasConfirmed: false,
    isOpen: false,
    resolver: null,
  })

/**
 * Step 6 - Disclosures and consent. "Save & Next" saves both consents, tells
 * the borrower it worked (a toast, like every other step) and moves on.
 */
function Harness({ onNext }: { onNext: () => void }) {
  const [disclosure, setDisclosure] = useState<DisclosureConsent>({
    agreeTerms: false,
    creditCheckConsent: false,
    eSignConsent: false,
    authorizeVerification: false,
    marketingOptIn: false,
  })
  return (
    <DisclosuresStep
      disclosure={disclosure}
      setDisclosure={setDisclosure}
      disclosureItems={disclosureItems}
      onNext={onNext}
      onBack={() => {}}
      loading={false}
      fundingRequestId={17}
    />
  )
}

const renderStep = (onNext = vi.fn()) => {
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <Harness onNext={onNext} />
    </QueryClientProvider>
  )
  return { onNext }
}

const serve = (apiData: Record<string, unknown>, onPost?: (body: any) => void, status = 200) =>
  server.use(
    http.get('*/borrower/funding-application/disclosures-and-consent', () =>
      HttpResponse.json({ status: true, data: apiData })
    ),
    http.post('*/borrower/funding-application/disclosures-and-consent', async ({ request }) => {
      onPost?.(await request.json())
      return status === 200
        ? HttpResponse.json({ status: true, message: 'saved', data: { id: 3 } })
        : HttpResponse.json({ status: false, message: 'Server down' }, { status })
    })
  )

describe('DisclosuresStep', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
    resetConfirmation()
  })

  /**
   * Defect: on an application that was already signed, cancelling the "this
   * will need a new signature" dialog ended the save with no message at all -
   * the borrower clicked Save & Next and nothing visible happened.
   */
  it('says the changes were not saved when the re-signature dialog is cancelled', async () => {
    let posted = false
    serve({ id: 3, credit_pull_authorization: true, terms_conditions_acceptance: true }, () => (posted = true))
    setEditRequiresConfirmation(true)
    const user = userEvent.setup()
    const { onNext } = renderStep()

    await waitFor(() => expect(screen.getByLabelText(/credit pull authorization/i)).toBeChecked())
    await user.click(screen.getByRole('button', { name: /save & next/i }))
    await waitFor(() => expect(useEditConfirmationStore.getState().isOpen).toBe(true))

    resolveEditConfirmation(false)

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith(SAVE_CANCELLED_MESSAGE, expect.anything()))
    expect(posted).toBe(false)
    expect(onNext).not.toHaveBeenCalled()
  })

  it('shows a success toast and moves on after Save & Next', async () => {
    let posted: any = null
    serve({}, (body) => (posted = body))
    const user = userEvent.setup()
    const { onNext } = renderStep()

    await user.click(await screen.findByLabelText(/credit pull authorization/i))
    await user.click(screen.getByLabelText(/terms & conditions acceptance/i))
    await user.click(screen.getByRole('button', { name: /save & next/i }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Disclosures saved successfully!'))
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(posted).toMatchObject({ funding_request_id: 17 })
  })

  it('shows the success toast when saving consents that were already given', async () => {
    serve({ id: 3, credit_pull_authorization: true, terms_conditions_acceptance: true })
    const user = userEvent.setup()
    const { onNext } = renderStep()

    await waitFor(() => expect(screen.getByLabelText(/credit pull authorization/i)).toBeChecked())
    await user.click(screen.getByRole('button', { name: /save & next/i }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Disclosures saved successfully!'))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('shows an error toast and stays on the step when the save fails', async () => {
    serve({ id: 3, credit_pull_authorization: true, terms_conditions_acceptance: true }, undefined, 500)
    const user = userEvent.setup()
    const { onNext } = renderStep()

    await waitFor(() => expect(screen.getByLabelText(/credit pull authorization/i)).toBeChecked())
    await user.click(screen.getByRole('button', { name: /save & next/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
  })
})
