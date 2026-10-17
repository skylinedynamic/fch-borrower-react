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
 *
 * Defect (QA 2026-10-16): the guideline spoke of a vague "review team", never
 * said who reviews the request (only the Host), what each decision means
 * (documents checked, missing documents, wrong funding) or which status the
 * request is at now; the multi-coloured cards were hard to read.
 */
describe('ReviewProgressCard status guidance', () => {
  it('explains every status in the order the request moves through them', () => {
    renderWithProviders(<ReviewProgressCard status={FUNDING_REVIEW_STATUS.PENDING} />)

    const titles = within(guideline()).getAllByRole('heading', { level: 6 }).map((h) => h.textContent)
    expect(titles).toEqual(['Submitted', 'Pending', 'Accepted', 'In Progress', 'Approved', 'Rejected', 'Cancelled'])
    expect(screen.queryByText(/admin can reviewing/i)).not.toBeInTheDocument()
  })

  it('says that only the Host reviews the request and what each decision means', () => {
    renderWithProviders(<ReviewProgressCard status={FUNDING_REVIEW_STATUS.PENDING} />)
    const g = within(guideline())

    expect(g.getByText(/only the host reviews it/i)).toBeInTheDocument()
    expect(g.getByText(/host checked your documents and information/i)).toBeInTheDocument()
    expect(g.getByText(/host is processing your request.*instructions/i)).toBeInTheDocument()
    expect(g.getByText(/everything is complete and correct/i)).toBeInTheDocument()
    expect(g.getByText(/documents are missing or the request is not correct/i)).toBeInTheDocument()
    expect(g.getByText(/wrong funding type/i)).toBeInTheDocument()
    expect(screen.queryByText(/review team/i)).not.toBeInTheDocument()
  })

  it.each([
    FUNDING_REVIEW_STATUS.PENDING,
    FUNDING_REVIEW_STATUS.IN_PROGRESS,
    FUNDING_REVIEW_STATUS.REJECTED,
  ])('marks %s as the current status in the guideline', (status) => {
    renderWithProviders(<ReviewProgressCard status={status} />)

    const current = within(guideline()).getByRole('listitem', { current: 'step' })
    expect(within(current).getByRole('heading', { level: 6 })).toHaveTextContent(status)
    expect(within(current).getByText('Current')).toBeInTheDocument()
  })

  it.each([
    [FUNDING_REVIEW_STATUS.PENDING, /host has not started reviewing/i],
    [FUNDING_REVIEW_STATUS.ACCEPTED, /host has checked your documents/i],
    [FUNDING_REVIEW_STATUS.IN_PROGRESS, /check activity and follow any instructions/i],
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
    [FUNDING_REVIEW_STATUS.REJECTED, /rejected because documents are missing/i],
    [FUNDING_REVIEW_STATUS.CANCELED, /cancelled/i],
  ])('when %s, says so and does not promise an application', (status, text) => {
    renderWithProviders(<ReviewProgressCard status={status} />)

    expect(within(nextStep()).getByText(text)).toBeInTheDocument()
    expect(within(nextStep()).queryByText(ONCE_APPROVED)).not.toBeInTheDocument()
  })
})
