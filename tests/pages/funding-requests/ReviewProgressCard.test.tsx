import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen, within } from '../../test-utils'
import ReviewProgressCard from '../../../src/pages/funding-requests/components/ReviewProgressCard'
import { FUNDING_REVIEW_STATUS } from '../../../src/config/funding'

const guideline = () => screen.getByRole('region', { name: 'Status Guideline' })
const nextStep = () => screen.getByRole('region', { name: 'What happens next' })
const ONCE_APPROVED = /you can start your funding application once this request is approved/i

/**
 * QA (funding-requests/38): the status guideline was unclear ("Admin can
 * reviewing the request."), had no Submitted entry, and nothing told the
 * borrower what to do at the current status or that the funding application
 * opens only once the request is approved.
 */
describe('ReviewProgressCard status guidance', () => {
  it('explains every status in the order the request moves through them', () => {
    renderWithProviders(<ReviewProgressCard status={FUNDING_REVIEW_STATUS.PENDING} />)

    const titles = within(guideline()).getAllByRole('heading', { level: 6 }).map((h) => h.textContent)
    expect(titles).toEqual(['Submitted', 'Pending', 'Accepted', 'In Progress', 'Approved', 'Rejected', 'Cancelled'])

    expect(within(guideline()).getByText('You submitted your funding request.')).toBeInTheDocument()
    expect(within(guideline()).getByText(/the review team is working on your request/i)).toBeInTheDocument()
    expect(within(guideline()).getByText('Your request is approved. You can start your funding application now.')).toBeInTheDocument()
    expect(screen.queryByText(/admin can reviewing/i)).not.toBeInTheDocument()
  })

  it.each([
    [FUNDING_REVIEW_STATUS.PENDING, /waiting for the review team/i],
    [FUNDING_REVIEW_STATUS.ACCEPTED, /accepted your request/i],
    [FUNDING_REVIEW_STATUS.IN_PROGRESS, /updates and questions .* appear under activity/i],
  ])('at %s says what is happening and that the application opens once approved', (status, text) => {
    renderWithProviders(<ReviewProgressCard status={status} />)

    expect(within(nextStep()).getByText(text)).toBeInTheDocument()
    expect(within(nextStep()).getByText(ONCE_APPROVED)).toBeInTheDocument()
  })

  it('when approved, tells the borrower to start the funding application now', () => {
    renderWithProviders(<ReviewProgressCard status={FUNDING_REVIEW_STATUS.APPROVED} />)

    expect(within(nextStep()).getByText(/start your funding application now/i)).toBeInTheDocument()
    expect(within(nextStep()).queryByText(ONCE_APPROVED)).not.toBeInTheDocument()
  })

  it.each([
    [FUNDING_REVIEW_STATUS.REJECTED, /declined/i],
    [FUNDING_REVIEW_STATUS.CANCELED, /cancelled/i],
  ])('when %s, says so and does not promise an application', (status, text) => {
    renderWithProviders(<ReviewProgressCard status={status} />)

    expect(within(nextStep()).getByText(text)).toBeInTheDocument()
    expect(within(nextStep()).queryByText(ONCE_APPROVED)).not.toBeInTheDocument()
  })
})
