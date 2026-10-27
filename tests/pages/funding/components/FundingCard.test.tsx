import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../../../test-utils'
import FundingCard from '../../../../src/pages/funding/components/FundingCard'

/**
 * A funding option card while the borrower's funding request for it is still
 * Pending (not yet approved or rejected).
 *
 * The card stays blocked, but what is waiting is a funding *request* - no
 * funding application exists yet.
 *
 * Defect: the tooltip said "Application Under Review ... You have already
 * submitted an application ... Status: Awaiting Review", naming an application
 * the borrower has not started. (The "Under Review" badge is correct as is.)
 */
const renderCard = (overrides: Record<string, unknown> = {}) =>
  renderWithProviders(
    <FundingCard
      id={14}
      icon="briefcase"
      icon_color="blue"
      name="Working Capital Equipment"
      subtitle="Equipment financing bundled with working capital"
      amount_range="$25,000 - $500,000"
      latest_review_status="Pending"
      {...overrides}
    />
  )

describe('FundingCard with a pending funding request', () => {
  it('labels the badge Under Review', () => {
    renderCard()

    expect(screen.getByText('Under Review')).toBeInTheDocument()
  })

  it('explains, on hover, that the funding request is under review - not an application', async () => {
    const user = userEvent.setup()
    const { container } = renderCard()

    await user.hover(container.querySelector('#funding-card-14') as HTMLElement)

    expect(screen.getByText('Funding Request Under Review')).toBeInTheDocument()
    expect(screen.getByText('You have already submitted a funding request for this funding option.')).toBeInTheDocument()
    expect(screen.getByText('Status: Pending Review')).toBeInTheDocument()
    expect(screen.getByText('You can still start a new funding request for this option.')).toBeInTheDocument()
    expect(screen.queryByText(/application/i)).not.toBeInTheDocument()
  })

  /**
   * Defect (BUG-116): the card was greyed and did nothing on click, while
   * /funding/:id offered Start Funding Request and the API accepted it. F131:
   * every funding request is a new one, so the card opens the option too.
   */
  it('still opens the funding option, like its detail page', async () => {
    const user = userEvent.setup()
    const { container } = renderWithProviders(
      <Routes>
        <Route path="/" element={<FundingCard id={14} icon="briefcase" icon_color="blue" name="Working Capital Equipment" latest_review_status="Pending" />} />
        <Route path="/funding/:id" element={<p>Funding option detail</p>} />
      </Routes>
    )
    const card = container.querySelector('#funding-card-14') as HTMLElement

    expect(card).not.toHaveClass('funding-card-disabled')
    await user.click(card)
    expect(screen.getByText('Funding option detail')).toBeInTheDocument()
  })

  it('shows the normal eligibility label once the request is no longer pending', () => {
    renderCard({ latest_review_status: 'Approved', engine_status: 'Active', engine_status_label: 'Eligible Now' })

    expect(screen.getByText('Eligible Now')).toBeInTheDocument()
    expect(screen.queryByText('Under Review')).not.toBeInTheDocument()
  })
})

/**
 * Defect (BUG-026, CP-FUND-04): the card always said "Likely Eligible" while
 * the detail page showed the engine's label ("Eligible Now", "Manual Review
 * Required", "Conditional"). The card shows the same label as the detail.
 */
describe('FundingCard eligibility label', () => {
  it.each([
    ['Active', 'Eligible Now'],
    ['Review', 'Manual Review Required'],
    ['Warning', 'Conditional'],
  ])('shows the engine label for %s, as the detail page does', (engine_status, engine_status_label) => {
    renderCard({ latest_review_status: null, engine_status, engine_status_label })

    expect(screen.getByText(engine_status_label)).toBeInTheDocument()
    expect(screen.queryByText('Likely Eligible')).not.toBeInTheDocument()
  })

  it('says Failed while underwriting factors are missing', () => {
    renderCard({ latest_review_status: null, engine_status: 'Warning', engine_status_label: 'Conditional', readiness_factors: [{ label: 'Time in Business', status: 'Failed' }] })

    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.queryByText('Conditional')).not.toBeInTheDocument()
  })
})
