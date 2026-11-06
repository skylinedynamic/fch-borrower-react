import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../../test-utils'
import FundingNeedsStep from '../../../../src/pages/prequalification/components/FundingNeedsStep'
import { purposeOfFundingOptions } from '../../../../src/data/profile'

/**
 * Pre-Qualification > Purpose of Funding offers the purposes list, as it
 * always has (purposeOfFundingOptions) - not the lender product categories -
 * and a purpose saved before is kept as it is.
 */
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

const items = () => Array.from(document.querySelectorAll('.dropdown-menu .list-group-item')).map((el) => el.textContent?.trim())

const openPurpose = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click((await screen.findByText('Select purpose')).closest('button') as HTMLElement)
}

describe('Pre-Qualification > Purpose of Funding', () => {
  it('offers the purposes list, not the lender product categories', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness initial={blank} />)

    await openPurpose(user)
    await waitFor(() => expect(items()).toEqual(purposeOfFundingOptions.map((o) => o.label)))
  })

  it('keeps a purpose saved before as it is', async () => {
    renderWithProviders(<Harness initial={{ ...blank, purposeOfFunding: 'Business Expansion' }} />)

    expect(await screen.findByText('Business Expansion')).toBeInTheDocument()
    expect(latest.purposeOfFunding).toBe('Business Expansion')
  })

  it('asks for the note when the purpose is Other', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness initial={blank} />)

    await openPurpose(user)
    await user.click(screen.getByText('Other', { selector: '.dropdown-menu .list-group-item' }))

    expect(await screen.findByText(/Purpose Of Funding Note/)).toBeInTheDocument()
  })
})
