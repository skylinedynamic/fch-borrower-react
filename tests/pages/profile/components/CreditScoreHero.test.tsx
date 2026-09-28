import { describe, expect, it } from 'vitest'

import CreditScoreHero from '../../../../src/pages/profile/components/CreditScoreHero'
import { renderWithProviders, screen } from '../../../test-utils'

/**
 * The scores at the top of the credit profile.
 *
 * They used to sit fifth on the page as label/value rows identical to "City"
 * and "Zip", so the figures a borrower opens the tab for carried no more weight
 * than their postcode.
 *
 * The part worth pinning is the scale. Each bureau uses a different one, so a
 * bare number means nothing on its own - 712 is strong on FICO and impossible
 * on Paydex - and the band colour has to follow the fraction of that scale
 * rather than the number.
 */
const metrics = {
  fico_score: 712,
  paydex_score: 80,
  experian_intelliscore: 55,
  equifax_score: 600,
  active_tradelines: 9,
  total_credit_limit: 42500,
  credit_utilization: 31,
  recent_inquiries: 2,
} as never

describe('CreditScoreHero', () => {
  it('shows every bureau score as a figure', () => {
    renderWithProviders(<CreditScoreHero metrics={metrics} />)

    expect(screen.getByText('712')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('55')).toBeInTheDocument()
    expect(screen.getByText('600')).toBeInTheDocument()
  })

  it('names the scale each score is measured on', () => {
    // Without it the number is unreadable: the scales do not share a range.
    renderWithProviders(<CreditScoreHero metrics={metrics} />)

    expect(screen.getByText('300–850')).toBeInTheDocument()
    expect(screen.getByText('0–100')).toBeInTheDocument()
    expect(screen.getByText('101–992')).toBeInTheDocument()
  })

  it('measures each bar against its own scale, not a shared one', () => {
    renderWithProviders(<CreditScoreHero metrics={metrics} />)

    const fico = screen.getByRole('progressbar', { name: 'FICO' })
    const paydex = screen.getByRole('progressbar', { name: 'Paydex' })

    expect(fico).toHaveAttribute('aria-valuemin', '300')
    expect(fico).toHaveAttribute('aria-valuemax', '850')
    expect(paydex).toHaveAttribute('aria-valuemin', '0')
    expect(paydex).toHaveAttribute('aria-valuemax', '100')
  })

  it('keeps the figures that explain the scores alongside them', () => {
    renderWithProviders(<CreditScoreHero metrics={metrics} />)

    expect(screen.getByText('$42,500')).toBeInTheDocument()
    expect(screen.getByText('31%')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('shows a dash rather than a zero for a score that is missing', () => {
    // A bureau that returned nothing is not a score of 0, which on FICO would
    // read as catastrophic.
    renderWithProviders(<CreditScoreHero metrics={{ fico_score: 712 } as never} />)

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('survives a profile with no metrics at all', () => {
    expect(() =>
      renderWithProviders(<CreditScoreHero metrics={undefined as never} />)
    ).not.toThrow()
  })
})
