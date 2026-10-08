import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../../test-utils'
import FundingCard from '../../../../src/pages/funding/components/FundingCard'

describe('FundingCard', () => {
  it('shows the name, subtitle, amount and status', () => {
    renderWithProviders(
      <FundingCard id={1} icon="landmark" icon_color="blue" name="SBA 7(a) Loan" subtitle="Government-backed" amount_range="$50K - $5M" />
    )
    expect(screen.getByText('SBA 7(a) Loan')).toBeInTheDocument()
    expect(screen.getByText('Government-backed')).toBeInTheDocument()
    expect(screen.getByText('$50K - $5M')).toBeInTheDocument()
    expect(screen.getByText('Likely Eligible')).toBeInTheDocument()
  })

  it('keeps the card short: no term and no labels on the amount', () => {
    renderWithProviders(
      <FundingCard id={1} icon="landmark" icon_color="blue" name="SBA 7(a) Loan" amount_range="$50K - $5M" terms="12-36 months" />
    )
    expect(screen.queryByText('12-36 months')).toBeNull()
    expect(screen.queryByText('Term')).toBeNull()
    expect(screen.queryByText('Amount')).toBeNull()
  })
})
