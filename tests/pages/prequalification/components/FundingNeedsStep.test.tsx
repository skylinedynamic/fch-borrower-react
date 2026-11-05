import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { server } from '../../../mocks/server'
import { renderWithProviders, screen, waitFor } from '../../../test-utils'
import FundingNeedsStep from '../../../../src/pages/prequalification/components/FundingNeedsStep'

/**
 * Request 2026-11-05 (final): Pre-Qualification > Purpose of Funding is the
 * purpose, as it was - the purposes list (GET /common/funding-purposes, the
 * funding application's Purpose of Funds list), not the lender product
 * categories - and a purpose saved before is kept as it is.
 */
const purposes = ['Business Expansion', 'Payroll', 'Working Capital', 'Other']

const blank = {
  fundingRequestedAmount: '', fundingUrgency: '', purposeOfFunding: '', purposeNote: '',
  personalCreditScore: '', estimatedBusinessCreditScore: '', existingBusinessDebt: false, debtBalance: '', notes: '',
}

let latest: typeof blank = blank

function Harness({ initial }: { initial: typeof blank }) {
  const [support, setSupport] = useState(initial)
  latest = support
  return <FundingNeedsStep support={support as any} setSupport={setSupport as any} onNext={vi.fn()} onPrevious={vi.fn()} />
}

const servePurposes = () =>
  server.use(
    http.get('*/common/funding-purposes', () => HttpResponse.json({ status: true, message: 'ok', data: purposes })),
    // Never the lender product categories.
    http.get('*/common/funding-types', () => HttpResponse.json({ status: true, message: 'ok', data: ['Term Loan', 'Sajib Product'] }))
  )

const items = () => Array.from(document.querySelectorAll('.dropdown-menu .list-group-item')).map((el) => el.textContent?.trim())

const openPurpose = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click((await screen.findByText('Select purpose')).closest('button') as HTMLElement)
}

describe('Pre-Qualification > Purpose of Funding', () => {
  afterEach(() => {
    server.resetHandlers()
    latest = blank
  })

  it('offers the purposes list, not the lender product categories', async () => {
    servePurposes()
    const user = userEvent.setup()
    renderWithProviders(<Harness initial={blank} />)

    await openPurpose(user)
    await waitFor(() => expect(items()).toEqual(purposes))
    expect(items()).not.toContain('Sajib Product')
  })

  it('keeps a purpose saved before as it is', async () => {
    servePurposes()
    renderWithProviders(<Harness initial={{ ...blank, purposeOfFunding: 'Business Expansion' }} />)

    expect(await screen.findByText('Business Expansion')).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 200))
    expect(latest.purposeOfFunding).toBe('Business Expansion')
  })

  it('still asks for the note when the purpose is Other', async () => {
    servePurposes()
    const user = userEvent.setup()
    renderWithProviders(<Harness initial={blank} />)

    await openPurpose(user)
    await waitFor(() => expect(items().length).toBeGreaterThan(0))
    await user.click(screen.getByText('Other', { selector: '.dropdown-menu .list-group-item' }))

    expect(await screen.findByText(/Purpose Of Funding Note/)).toBeInTheDocument()
  })
})
