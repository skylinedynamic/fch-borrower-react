import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../../mocks/server'
import { createTestQueryClient } from '../../../../test-utils'
import OwnershipInformationStep from '../../../../../src/pages/fundapplication/components/steps/OwnershipInformationStep'
import type { OwnerInfo, CoBorrower } from '../../../../../src/pages/fundapplication/types'
import { countries, clearLocationCache } from '../../../../../src/modules/location'
import { toast } from 'react-toastify'
import { VALIDATION_ERROR_MESSAGE } from '../../../../../src/modules/funding-application/saveFeedback'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

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
  // `countries` (src/modules/location) starts empty and is normally filled by
  // loadLocations(), which main.jsx awaits before the app ever mounts — a
  // guarantee this render-in-isolation test doesn't get for free. Without a
  // seeded entry, getDefaultCountry() (called whenever the fetched
  // ownership-info payload has no country of its own, as every fixture here
  // does) reads .name off undefined and throws.
  beforeEach(() => {
    clearLocationCache()
    countries.push({ name: 'United States', code: 'USA', currency: 'USD', phone_code: '+1', flag: '', states: [] })
  })

  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
    clearLocationCache()
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

    const ssnInput = await screen.findByLabelText(/social security number/i)
    await user.type(ssnInput, '123456789')

    expect((ssnInput as HTMLInputElement).value).toBe('123-45-6789')

    const save = getSave()
    expect(save).toBeTruthy()
    await save!()

    await waitFor(() => expect(receivedBody).not.toBeNull())
    expect(receivedBody.ssn).toBe('123456789')
    expect(receivedBody.ssn).not.toContain('-')
  })

  /**
   * Defect (BUG-108): a saved co-borrower stayed hidden on reopening the step -
   * the box followed has_co_borrower alone, so a saved list with the flag off
   * showed an unticked box and no table. A co-borrower on file ticks it.
   */
  it('ticks Has Co-Borrower and lists the co-borrowers on file', async () => {
    server.use(
      http.get('*/borrower/funding-application/ownership-info', () =>
        HttpResponse.json({ status: true, data: { ownership_percentage: 60, has_co_borrower: false, co_borrowers: [{ id: 3, first_name: 'Kazi', last_name: 'Mia', role: 'Partner', ownership: 40, email: 'kazi@example.test', mobile_phone: '(767) 677-6767' }] } })
      )
    )
    renderStep()

    expect(await screen.findByText('Kazi')).toBeInTheDocument()
    expect(screen.getByLabelText('Has Co-Borrower?')).toBeChecked()
  })

  it('shows a phone example a real US number could be', async () => {
    renderStep()

    // (123) 456-7890 is not one: an area code never starts with 1.
    expect(await screen.findByPlaceholderText('(555) 555-5555')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('(123) 456-7890')).not.toBeInTheDocument()
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

    const ssnInput = await screen.findByLabelText(/social security number/i)
    await user.type(ssnInput, '123456789')
    await getSave()!()

    const allLoggedArgs = [...logSpy.mock.calls, ...infoSpy.mock.calls].flat().map(String)
    expect(allLoggedArgs.some((arg) => arg.includes('123456789') || arg.includes('123-45-6789'))).toBe(false)
  })

  it('pre-fills a full SSN returned by the API masked, as on the profile, in full on the eye button', async () => {
    server.use(
      http.get('*/borrower/funding-application/ownership-info', () =>
        HttpResponse.json({ status: true, data: { ssn: '987654321', first_name: 'Jane' } })
      )
    )
    const user = userEvent.setup()

    renderStep()

    const ssnInput = await screen.findByLabelText(/social security number/i)
    await waitFor(() => expect((ssnInput as HTMLInputElement).value).toBe('***-**-4321'))
    await user.click(screen.getByRole('button', { name: /show ssn/i }))
    expect((ssnInput as HTMLInputElement).value).toBe('987-65-4321')
  })
})

/**
 * The country list is fetched at boot, and main.jsx renders the app even when
 * that request fails - reference data is not worth a blank application. So an
 * empty list is a state this step has to survive: getDefaultCountry() has
 * nothing to return, and the pre-fill effect used to read `.name` straight off
 * it, which threw inside the state updater and took the whole step down with it.
 * An applicant then saw nothing at all rather than a form with no country picked.
 */
describe('OwnershipInformationStep — when the country list never loaded', () => {
  afterEach(() => {
    clearLocationCache()
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  it('still renders and pre-fills, leaving the country unset', async () => {
    clearLocationCache()
    server.use(
      http.get('*/borrower/funding-application/ownership-info', () =>
        HttpResponse.json({ status: true, data: { ssn: '987654321', first_name: 'Jane' } })
      )
    )

    renderStep()

    const ssnInput = await screen.findByLabelText(/social security number/i)
    await waitFor(() => expect((ssnInput as HTMLInputElement).value).toBe('***-**-4321'))
  })

  it('defaults the country to the US once the list is there', async () => {
    countries.splice(0, countries.length, {
      name: 'United States',
      code: 'USA',
      currency: 'USD',
      phone_code: '+1',
      flag: '🇺🇸',
      states: [],
    })
    server.use(
      http.get('*/borrower/funding-application/ownership-info', () =>
        HttpResponse.json({ status: true, data: { first_name: 'Jane' } })
      )
    )

    renderStep()

    // The API sent no country, so the default fills it in. The picker is a
    // CustomDropdown, which renders the selected option as its label text
    // rather than as an input value.
    expect(await screen.findByText('United States')).toBeInTheDocument()
  })
})

describe('OwnershipInformationStep — save messages', () => {
  beforeEach(() => {
    clearLocationCache()
    countries.push({ name: 'United States', code: 'USA', currency: 'USD', phone_code: '+1', flag: '', states: [] })
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
    clearLocationCache()
  })

  /**
   * Defect: a validation error (422) only highlighted the fields - no message,
   * so the borrower clicked Save and saw nothing happen.
   */
  it('shows a message, not just highlighted fields, when the save fails validation', async () => {
    server.use(
      http.get('*/borrower/funding-application/ownership-info', () => HttpResponse.json({ status: true, data: {} })),
      http.post('*/borrower/funding-application/ownership-info', () =>
        HttpResponse.json(
          { status: false, message: 'The ssn field is required.', errors: { ssn: ['The ssn field is required.'] } },
          { status: 422 }
        )
      )
    )
    const { getSave } = renderStep()
    await screen.findByLabelText(/social security number/i)

    await expect(getSave()!()).resolves.toBe(false)

    expect(toast.error).toHaveBeenCalledWith(VALIDATION_ERROR_MESSAGE, expect.anything())
    expect(await screen.findByText('The ssn field is required.')).toBeInTheDocument()
  })
})
