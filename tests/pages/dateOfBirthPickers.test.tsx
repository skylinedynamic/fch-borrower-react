import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../test-utils'
import PersonalInfo from '../../src/pages/profile/components/PersonalInfo'
import OwnershipInformationStep from '../../src/pages/fundapplication/components/steps/OwnershipInformationStep'
import CoBorrowerModal from '../../src/pages/fundapplication/components/shared/CoBorrowerModal'
import { openOnLatestDateOfBirth } from '../../src/utils/dateOfBirth'
import type { SavePersonalInfoRequest } from '../../src/modules/profile/types'
import type { CoBorrower, OwnerInfo } from '../../src/pages/fundapplication/types'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))

/**
 * Every date-of-birth calendar in the borrower portal: every year up to today
 * can be picked, an empty field opens 18 years back (openOnLatestDateOfBirth),
 * and an under-18 date gets "You must be at least 18 years old to continue."
 * under the field with the field marked invalid (red border) - the API's
 * message for the same rule. react-flatpickr is replaced by a stub that
 * records each picker's options. (Credit Profile: CreditProfileTab.test.tsx.)
 */
const MESSAGE = 'You must be at least 18 years old to continue.'

const pickers = vi.hoisted(() => [] as Array<{ placeholder?: string; options: Record<string, any> }>)
vi.mock('react-flatpickr', () => ({
  default: ({ options, className, placeholder }: any) => {
    pickers.push({ placeholder, options: options || {} })
    return <input className={className} placeholder={placeholder} data-dob-picker="" readOnly />
  },
}))

// The tabs load their data first; any request gets an empty answer.
beforeEach(() => server.use(http.all('*', () => HttpResponse.json({ status: true, data: {} }))))
afterEach(() => server.resetHandlers())

const wrap = (ui: React.ReactElement) => {
  pickers.length = 0
  return render(<QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>)
}

const expectOpensEighteenYearsBack = (dobPickers: Array<Record<string, any>>) => {
  expect(dobPickers.length).toBeGreaterThan(0)
  dobPickers.forEach(o => {
    expect(o.maxDate).toBe('today')
    expect(o.onOpen).toBe(openOnLatestDateOfBirth)
  })
}

const owner = (dob = '') => ({
  id: null, firstName: 'Jane', lastName: 'Owner', dob, ssn: '', citizenship: 'US Citizen', streetAddress: '',
  country: 'United States', city: '', state: '', zip: '', ownershipPct: '100', hasCoBorrower: false, phoneNumber: '',
}) as unknown as OwnerInfo

const coBorrower = (dob = '') => ({
  id: null, firstName: 'John', lastName: 'Co', role: 'Owner', ownershipPct: '50', email: 'john@example.com',
  mobilePhone: '', homePhone: '', streetAddress: '', country: 'United States', city: '', state: '', zip: '',
  ssn: '', dob, driversLicenseNumber: '', driversLicenseState: '',
}) as unknown as CoBorrower

const ownerStep = (dob = '') => (
  <OwnershipInformationStep
    owner={owner(dob)} setOwner={() => {}} coBorrowers={[]} setCoBorrowers={() => {}}
    onShowCoModal={() => {}} onDeleteCoBorrower={() => {}} coDraft={coBorrower()} setCoDraft={() => {}}
    onAddCoBorrower={() => {}} onEditCoBorrower={() => {}} onNext={() => {}} onBack={() => {}} loading={false}
    isValid
  />
)

const dobInput = (placeholder?: string) =>
  document.querySelector<HTMLInputElement>(placeholder ? `input[placeholder="${placeholder}"]` : 'input[data-dob-picker]')!

describe('borrower date-of-birth calendars open 18 years back', () => {
  it('Profile -> Personal Info', async () => {
    wrap(<PersonalInfo data={{ date_of_birth: '' } as SavePersonalInfoRequest} onChange={() => {}} onSave={() => {}} />)
    await waitFor(() => expect(pickers.some(p => p.placeholder === 'Select date of birth')).toBe(true))
    expectOpensEighteenYearsBack(pickers.filter(p => p.placeholder === 'Select date of birth').map(p => p.options))
  })

  it('funding application owner', async () => {
    wrap(ownerStep())
    await waitFor(() => expect(pickers.some(p => p.options.onOpen)).toBe(true))
    expectOpensEighteenYearsBack(pickers.map(p => p.options).filter(o => o.onOpen))
  })

  it('funding application co-borrower', () => {
    wrap(<CoBorrowerModal coDraft={coBorrower()} setCoDraft={() => {}} onSubmit={() => {}} isEditing={false} />)
    expectOpensEighteenYearsBack(pickers.map(p => p.options).filter(o => o.onOpen))
  })
})

describe('an under-18 date of birth gets the message and a red border', () => {
  it('Profile -> Personal Info, born 23 Jun 2016', async () => {
    wrap(<PersonalInfo data={{ date_of_birth: '2016-06-23' } as SavePersonalInfoRequest} onChange={() => {}} onSave={() => {}} />)

    expect(await screen.findByText(MESSAGE)).toBeInTheDocument()
    expect(dobInput('Select date of birth')).toHaveClass('is-invalid')
  })

  it('Profile -> Personal Info, an adult has neither', async () => {
    wrap(<PersonalInfo data={{ date_of_birth: '1985-04-12' } as SavePersonalInfoRequest} onChange={() => {}} onSave={() => {}} />)

    await waitFor(() => expect(dobInput('Select date of birth')).not.toBeNull())
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
    expect(dobInput('Select date of birth')).not.toHaveClass('is-invalid')
  })

  it('funding application owner', async () => {
    wrap(ownerStep('2016-06-23'))

    expect(await screen.findByText(MESSAGE)).toBeInTheDocument()
    expect(document.querySelector('input[data-dob-picker].is-invalid')).not.toBeNull()
  })

  it('funding application co-borrower', () => {
    wrap(<CoBorrowerModal coDraft={coBorrower('2016-06-23')} setCoDraft={() => {}} onSubmit={() => {}} isEditing={false} />)

    expect(screen.getByText(MESSAGE)).toBeInTheDocument()
    expect(document.querySelector('input[data-dob-picker].is-invalid')).not.toBeNull()
  })
})
