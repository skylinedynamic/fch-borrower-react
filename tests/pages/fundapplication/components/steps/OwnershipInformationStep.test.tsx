import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../../mocks/server'
import { createTestQueryClient } from '../../../../test-utils'
import OwnershipInformationStep from '../../../../../src/pages/fundapplication/components/steps/OwnershipInformationStep'
import type { OwnerInfo, CoBorrower } from '../../../../../src/pages/fundapplication/types'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// react-flatpickr wraps the vanilla flatpickr library, which schedules async
// DOM-manipulation timeouts (via the app's custom yearDropdownPlugin) that
// outlive jsdom test teardown and throw. Not the date picker's own behavior
// under test here, so it's replaced with a plain controlled input.
vi.mock('react-flatpickr', () => ({
  default: ({ value, onChange, className, placeholder }: any) => (
    <input
      className={className}
      value={value || ''}
      placeholder={placeholder}
      onChange={(e: any) => onChange([e.target.value], e.target.value)}
    />
  ),
}))

const baseOwner: OwnerInfo = {
  id: null,
  firstName: 'Jane',
  lastName: 'Borrower',
  dob: '1990-01-01',
  ssn: '',
  citizenship: 'US Citizen',
  streetAddress: '123 Main St',
  country: 'United States',
  city: 'Austin',
  state: 'Texas',
  zip: '78701',
  ownershipPct: '100',
  hasCoBorrower: false,
  phoneNumber: '(512) 555-0100',
}

function Harness({ onSaveReady }: { onSaveReady: (fn: () => Promise<boolean>) => void }) {
  const [owner, setOwner] = useState<OwnerInfo>(baseOwner)
  const [coBorrowers, setCoBorrowers] = useState<CoBorrower[]>([])

  return (
    <OwnershipInformationStep
      owner={owner}
      setOwner={setOwner}
      coBorrowers={coBorrowers}
      setCoBorrowers={setCoBorrowers}
      onShowCoModal={() => {}}
      onDeleteCoBorrower={() => {}}
      coDraft={{} as CoBorrower}
      setCoDraft={() => {}}
      onAddCoBorrower={() => {}}
      onEditCoBorrower={() => {}}
      onNext={() => {}}
      onBack={() => {}}
      loading={false}
      isValid={true}
      onRegisterSave={(fn) => fn && onSaveReady(fn)}
      fundingRequestId={7}
    />
  )
}

const renderStep = () => {
  let save: (() => Promise<boolean>) | null = null
  const queryClient = createTestQueryClient()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <Harness onSaveReady={(fn) => (save = fn)} />
    </QueryClientProvider>
  )
  return { ...utils, getSave: () => save }
}

describe('OwnershipInformationStep — SSN handling (PII, FCRA-relevant)', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  it('displays the SSN formatted as user types, but sends only unformatted digits on save', async () => {
    server.use(
      http.get('*/borrower/funding-application/ownership-info', () =>
        HttpResponse.json({ status: true, data: {} })
      )
    )
    let receivedBody: any = null
    server.use(
      http.post('*/borrower/funding-application/ownership-info', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, data: { id: 1 } })
      })
    )

    const user = userEvent.setup()
    const { getSave } = renderStep()

    const ssnInput = await screen.findByPlaceholderText('xxx-xx-xxxx')
    await user.type(ssnInput, '123456789')

    expect((ssnInput as HTMLInputElement).value).toBe('123-45-6789')

    const save = getSave()
    expect(save).toBeTruthy()
    await save!()

    await waitFor(() => expect(receivedBody).not.toBeNull())
    expect(receivedBody.ssn).toBe('123456789')
    expect(receivedBody.ssn).not.toContain('-')
  })

  it('never logs the SSN to the console while typing or saving', async () => {
    server.use(
      http.get('*/borrower/funding-application/ownership-info', () => HttpResponse.json({ status: true, data: {} })),
      http.post('*/borrower/funding-application/ownership-info', () => HttpResponse.json({ status: true, data: { id: 1 } }))
    )
    const logSpy = vi.spyOn(console, 'log')
    const infoSpy = vi.spyOn(console, 'info')

    const user = userEvent.setup()
    const { getSave } = renderStep()

    const ssnInput = await screen.findByPlaceholderText('xxx-xx-xxxx')
    await user.type(ssnInput, '123456789')
    await getSave()!()

    const allLoggedArgs = [...logSpy.mock.calls, ...infoSpy.mock.calls].flat().map(String)
    expect(allLoggedArgs.some((arg) => arg.includes('123456789') || arg.includes('123-45-6789'))).toBe(false)
  })

  it('pre-fills and re-formats a full SSN returned by the API', async () => {
    server.use(
      http.get('*/borrower/funding-application/ownership-info', () =>
        HttpResponse.json({ status: true, data: { ssn: '987654321', first_name: 'Jane' } })
      )
    )

    renderStep()

    const ssnInput = await screen.findByPlaceholderText('xxx-xx-xxxx')
    await waitFor(() => expect((ssnInput as HTMLInputElement).value).toBe('987-65-4321'))
  })
})
