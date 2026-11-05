import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { server } from '../../../mocks/server'
import { renderWithProviders, screen, waitFor } from '../../../test-utils'
import FundingNeedsStep from '../../../../src/pages/prequalification/components/FundingNeedsStep'

/**
 * Request 2026-11-05: Pre-Qualification > Purpose of Funding offers the lender
 * product categories (GET /common/funding-types) - the same list as the
 * funding application's Preferred Funding Type - not a hard-coded list. A
 * purpose saved before that is not a category is cleared, to be chosen again.
 */
const categories = ['Term Loan', 'Business Line of Credit', 'Other']

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

const serveCategories = () =>
  server.use(http.get('*/common/funding-types', () => HttpResponse.json({ status: true, message: 'ok', data: categories })))

const openPurpose = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click((await screen.findByText('Select purpose')).closest('button') as HTMLElement)
  return waitFor(() => {
    const items = Array.from(document.querySelectorAll('.dropdown-menu .list-group-item')).map((el) => el.textContent?.trim())
    expect(items.length).toBeGreaterThan(0)
    return items
  })
}

describe('Pre-Qualification > Purpose of Funding', () => {
  afterEach(() => {
    server.resetHandlers()
    latest = blank
  })

  it('offers the lender product categories from the common API, nothing else', async () => {
    serveCategories()
    const user = userEvent.setup()
    renderWithProviders(<Harness initial={blank} />)

    await openPurpose(user)
    await waitFor(() =>
      expect(Array.from(document.querySelectorAll('.dropdown-menu .list-group-item')).map((el) => el.textContent?.trim())).toEqual(categories)
    )
  })

  it('clears a purpose saved before that is not a category, to be chosen again', async () => {
    serveCategories()
    renderWithProviders(<Harness initial={{ ...blank, purposeOfFunding: 'Working Capital' }} />)

    await waitFor(() => expect(latest.purposeOfFunding).toBe(''))
  })

  it('keeps a saved purpose that is a category', async () => {
    serveCategories()
    renderWithProviders(<Harness initial={{ ...blank, purposeOfFunding: 'Term Loan' }} />)

    expect(await screen.findByText('Term Loan')).toBeInTheDocument()
    expect(latest.purposeOfFunding).toBe('Term Loan')
  })

  it('still asks for the note when the purpose is Other', async () => {
    serveCategories()
    const user = userEvent.setup()
    renderWithProviders(<Harness initial={blank} />)

    await openPurpose(user)
    await user.click(screen.getByText('Other', { selector: '.dropdown-menu .list-group-item' }))

    expect(await screen.findByText(/Purpose Of Funding Note/)).toBeInTheDocument()
  })
})
