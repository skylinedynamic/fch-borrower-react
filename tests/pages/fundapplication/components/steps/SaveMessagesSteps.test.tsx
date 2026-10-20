import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../../mocks/server'
import { createTestQueryClient } from '../../../../test-utils'
import BusinessInformationStep from '../../../../../src/pages/fundapplication/components/steps/BusinessInformationStep'
import FinancialInformationStep from '../../../../../src/pages/fundapplication/components/steps/FinancialInformationStep'
import type { BusinessDetails, FinancialInfo, PersonalInfo } from '../../../../../src/pages/fundapplication/types'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
// A plain input in place of flatpickr, whose timers outlive jsdom teardown.
vi.mock('react-flatpickr', () => ({
  default: ({ value, onChange, className, placeholder }: any) => (
    <input className={className} value={value || ''} placeholder={placeholder} onChange={(e: any) => onChange([e.target.value], e.target.value)} />
  ),
}))

import { toast } from 'react-toastify'
import { SAVE_CANCELLED_MESSAGE, VALIDATION_ERROR_MESSAGE } from '../../../../../src/modules/funding-application/saveFeedback'
import {
  useEditConfirmationStore,
  setEditRequiresConfirmation,
  resolveEditConfirmation,
} from '../../../../../src/store/fundApplication/editConfirmationStore'

/**
 * Business Information (step 1) and Financial Information (step 3): every
 * save ends with a message - saved, a validation error, a failure, or the
 * borrower cancelling the "this will need a new signature" dialog.
 *
 * Defect: a validation error (422) only highlighted fields and a cancelled
 * dialog said nothing, so Save & Next looked like it did nothing.
 */
const personal: PersonalInfo = { fullName: 'Jane Borrower', businessName: 'Borrower Co', email: 'jane@example.test', phoneCountry: 'US', phoneNumber: '5125550100' }
const business: BusinessDetails = {
  businessName: 'Borrower Co', businessAddress: '9 Main St', city: 'Austin', state: 'Texas', incorporationState: '',
  zip: '78701', industryType: 'Retail', entityType: 'LLC', yearsInBusiness: '5', employees: '',
}
const financial: FinancialInfo = {
  monthlyRevenue: '10000', annualRevenue: '120000', bankName: 'Chase', checkingStartDate: '2020-01-01',
  personalCreditScore: '700', businessCreditScore: '80', existingDebt: false, debtBalance: '',
}

function BusinessHarness({ onSaveReady }: { onSaveReady: (fn: () => Promise<boolean>) => void }) {
  const [p, setP] = useState(personal)
  const [b, setB] = useState(business)
  return (
    <BusinessInformationStep personal={p} setPersonal={setP} business={b} setBusiness={setB} canProceed onNext={() => {}}
      loading={false} fundingRequestId={7} onRegisterSave={(fn) => fn && onSaveReady(fn)} />
  )
}

function FinancialHarness({ onSaveReady }: { onSaveReady: (fn: () => Promise<boolean>) => void }) {
  const [f, setF] = useState(financial)
  return (
    <FinancialInformationStep financial={f} setFinancial={setF} onNext={() => {}} onBack={() => {}}
      loading={false} fundingRequestId={7} onRegisterSave={(fn) => fn && onSaveReady(fn)} />
  )
}

const steps = [
  { name: 'Business Information', path: 'business-info', Harness: BusinessHarness, success: 'Business information saved successfully!' },
  { name: 'Financial Information', path: 'financial-info', Harness: FinancialHarness, success: 'Financial information saved successfully!' },
] as const

const renderStep = (Harness: (typeof steps)[number]['Harness']) => {
  let save: (() => Promise<boolean>) | null = null
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <Harness onSaveReady={(fn) => (save = fn)} />
    </QueryClientProvider>
  )
  return { getSave: () => save }
}

const serve = (path: string, post: () => Response, onPost?: () => void) =>
  server.use(
    http.get(`*/borrower/funding-application/${path}`, () => HttpResponse.json({ status: true, data: { id: 21 } })),
    http.post(`*/borrower/funding-application/${path}`, () => {
      onPost?.()
      return post()
    })
  )

const resetConfirmation = () =>
  useEditConfirmationStore.setState({ requiresConfirmation: false, isResolving: false, promptOnOpen: null, hasConfirmed: false, isOpen: false, resolver: null })

describe.each(steps)('$name step save messages', ({ path, Harness, success }) => {
  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
    resetConfirmation()
  })

  it('shows the success message when saved', async () => {
    serve(path, () => HttpResponse.json({ status: true, data: { id: 21 } }))
    const { getSave } = renderStep(Harness)
    await waitFor(() => expect(getSave()).toBeTruthy())

    await expect(getSave()!()).resolves.toBe(true)
    expect(toast.success).toHaveBeenCalledWith(success)
  })

  it('shows a message and highlights the field for a validation error', async () => {
    serve(path, () => HttpResponse.json({ status: false, message: 'Invalid', errors: { business_name: ['Business name is required.'], monthly_revenue: ['Monthly revenue is required.'] } }, { status: 422 }))
    const { getSave } = renderStep(Harness)
    await waitFor(() => expect(getSave()).toBeTruthy())

    await expect(getSave()!()).resolves.toBe(false)
    expect(toast.error).toHaveBeenCalledWith(VALIDATION_ERROR_MESSAGE, expect.anything())
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('shows the server message when the save fails', async () => {
    serve(path, () => HttpResponse.json({ status: false, message: 'Server down' }, { status: 500 }))
    const { getSave } = renderStep(Harness)
    await waitFor(() => expect(getSave()).toBeTruthy())

    await expect(getSave()!()).resolves.toBe(false)
    expect(toast.error).toHaveBeenCalledWith('Server down')
  })

  it('says the changes were not saved when the re-signature dialog is cancelled', async () => {
    let posted = false
    serve(path, () => HttpResponse.json({ status: true, data: { id: 21 } }), () => (posted = true))
    setEditRequiresConfirmation(true)
    const { getSave } = renderStep(Harness)
    await waitFor(() => expect(getSave()).toBeTruthy())

    const result = getSave()!()
    await waitFor(() => expect(useEditConfirmationStore.getState().isOpen).toBe(true))
    resolveEditConfirmation(false)

    await expect(result).resolves.toBe(false)
    expect(toast.info).toHaveBeenCalledWith(SAVE_CANCELLED_MESSAGE, expect.anything())
    expect(posted).toBe(false)
  })
})

it('renders the step forms', async () => {
  serve('business-info', () => HttpResponse.json({ status: true, data: { id: 21 } }))
  renderStep(BusinessHarness)
  expect(await screen.findByDisplayValue('9 Main St')).toBeInTheDocument()
})
