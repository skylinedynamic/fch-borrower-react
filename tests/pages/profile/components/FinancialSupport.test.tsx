import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../mocks/server'
import { createTestQueryClient } from '../../../test-utils'
import FinancialSupport from '../../../../src/pages/profile/components/FinancialSupport'
import { LOCKED_FINANCIAL_FIELDS } from '../../../../src/config/profileLockFields'
import { countries, clearLocationCache } from '../../../../src/modules/location'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
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

/**
 * The Financial tab of the profile page.
 *
 * Retroactive coverage of behaviour that already shipped, so these are
 * characterization tests rather than a change being driven.
 *
 * The rule worth holding is the locking one, because it is the only place on
 * the profile where a borrower CANNOT simply correct what they typed. A field
 * locks when it is named in LOCKED_FINANCIAL_FIELDS *and* already carries a
 * value from the API - both halves matter, and dropping either one silently
 * changes who can edit a figure that lenders are matched against.
 */

const blank = {
  currency: '',
  monthly_revenue: '',
  annual_revenue: '',
  annual_personal_income: '',
  average_monthly_deposits: '',
  monthly_deposit_count: '',
  avg_bank_balance: '',
  current_business_debt: '',
  nsf_count: '',
  negative_days: '',
  bank_accounts: [],
}

/** The tab is controlled by its parent, so the test owns the state it edits. */
function Harness({ initial = blank }: { initial?: Record<string, unknown> }) {
  const [data, setData] = useState<Record<string, unknown>>(initial)

  return (
    <FinancialSupport
      data={data}
      onChange={setData}
      onSave={() => {}}
      onBack={() => {}}
      saving={false}
    />
  )
}

const renderTab = (initial?: Record<string, unknown>) =>
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <Harness initial={initial} />
    </QueryClientProvider>
  )

const serveFinancial = (data: Record<string, unknown>) =>
  server.use(
    http.get('*/borrower/profile/financial-info', () =>
      HttpResponse.json({ status: true, data })
    )
  )

describe('Profile — Financial tab', () => {
  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  // BUG-077: a client with no stored currency had to pick USD again to save.
  describe('currency', () => {
    beforeEach(() => {
      countries.splice(0, countries.length,
        { name: 'United States', code: 'US', currency: 'USD', phone_code: '+1', flag: '', states: [] },
        { name: 'Canada', code: 'CA', currency: 'CAD', phone_code: '+1', flag: '', states: [] },
      )
    })
    afterEach(() => clearLocationCache())

  it('starts the currency at USD when none is stored', async () => {
    serveFinancial({ currency: null })

    renderTab()

    expect(await screen.findByText(/^USD - /)).toBeInTheDocument()
    expect(screen.queryByText('Select currency')).not.toBeInTheDocument()
  })

  it('keeps the stored currency', async () => {
    serveFinancial({ currency: 'CAD' })

    renderTab()

    expect(await screen.findByText(/^CAD - /)).toBeInTheDocument()
  })
  })

  it('shows the figures the API already holds', async () => {
    serveFinancial({ monthly_revenue: '$20,000' })

    renderTab({ ...blank, monthly_revenue: '$20,000' })

    expect(await screen.findByDisplayValue('$20,000')).toBeInTheDocument()
  })

  it('formats a revenue figure as currency while it is typed', async () => {
    serveFinancial({})

    const user = userEvent.setup()
    renderTab()

    const revenue = await screen.findByPlaceholderText('$20,000')
    await user.type(revenue, '20000')

    // formatCurrency groups the digits; the $ belongs to the placeholder, not
    // to the stored value.
    await waitFor(() => expect((revenue as HTMLInputElement).value).toBe('20,000'))
  })

  // ── the locking rule ──────────────────────────────────────────────────

  it('locks a listed field once the API has a value for it', async () => {
    // Both halves of the rule are satisfied here, so the borrower is sent
    // through a change request instead of editing in place.
    serveFinancial({ monthly_revenue: '$20,000' })

    renderTab({ ...blank, monthly_revenue: '$20,000' })

    const revenue = await screen.findByDisplayValue('$20,000')

    expect(revenue).toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: /change request/i })).toBeInTheDocument()
  })

  it('leaves a listed field editable while the API has nothing for it', async () => {
    // Half the rule only. A borrower filling the tab in for the first time
    // must be able to type, and to correct a typo before saving.
    serveFinancial({ monthly_revenue: null })

    const user = userEvent.setup()
    renderTab()

    const revenue = await screen.findByPlaceholderText('$20,000')

    expect(revenue).not.toHaveAttribute('readonly')

    await user.type(revenue, '5000')
    await waitFor(() => expect((revenue as HTMLInputElement).value).toBe('5,000'))
  })

  it('leaves an unlisted field editable even once it has a value', async () => {
    // current_business_debt is deliberately not in the list, so a value in it
    // does not lock it. This is what pins the list as the thing that decides.
    expect(LOCKED_FINANCIAL_FIELDS).not.toContain('current_business_debt')

    serveFinancial({ current_business_debt: '$4,000' })

    renderTab({ ...blank, current_business_debt: '$4,000' })

    const debt = await screen.findByDisplayValue('$4,000')

    expect(debt).not.toHaveAttribute('readonly')
  })

  it('treats an empty string from the API as nothing, not as a value', async () => {
    // A field the borrower cleared and saved comes back as '' rather than
    // null. Locking on that would strand them with a blank they cannot fill.
    serveFinancial({ annual_revenue: '' })

    renderTab()

    const annual = await screen.findByPlaceholderText('$30,000')

    expect(annual).not.toHaveAttribute('readonly')
  })

  it('renders while the API is still answering', () => {
    serveFinancial({})

    expect(() => renderTab()).not.toThrow()
  })
})
