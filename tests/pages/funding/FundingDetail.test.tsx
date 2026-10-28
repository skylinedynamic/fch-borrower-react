import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen, within } from '../../test-utils'
import { server } from '../../mocks/server'
import FundingDetail from '../../../src/pages/funding/components/FundingDetail'

afterEach(() => server.resetHandlers())

/**
 * The call-to-action on a funding option's detail page.
 *
 * Every funding request is a new one. Whatever the borrower already has for
 * this option - a pending request, an approved one, an application On Hold or
 * in review, or one that is settled - the card offers "Start Funding Request"
 * and links into a fresh wizard. It never offers "Edit Application",
 * "View Application" or "Process Application" for an earlier round.
 *
 * Only eligibility (a hidden option, or missing underwriting factors) stops the
 * borrower from starting.
 */

const detail = (overrides: Record<string, unknown> = {}) => ({
  id: 2,
  name: 'Business Credit Builder Cards',
  subtitle: 'Net-30 vendor accounts',
  amount_range: '1000 - 50000',
  terms: '12 months',
  speed_to_funds: '3',
  uses: ['Working Capital'],
  description: 'Net-30 vendor accounts and secured business credit cards.',
  icon: 'credit-card',
  icon_color: 'blue',
  engine_status: 'Active',
  engine_status_label: 'Eligible Now',
  qualify_reasons: [],
  readiness_factors: [],
  missing_documents: [],
  latest_review_status: 'Approved',
  latest_review_id: 7,
  has_funding_application: true,
  can_start_new_funding_request: false,
  ...overrides,
})

const renderDetail = (overrides: Record<string, unknown> = {}, readiness: Array<Record<string, unknown>> = []) => {
  server.use(
    http.get('*/borrower/funding/2', () => HttpResponse.json({ status: true, data: detail(overrides) })),
    http.get('*/common/funding-qualification/*/readiness-factors', () =>
      HttpResponse.json({ status: true, data: readiness })
    )
  )

  // Rendered behind its real route: the component reads the option id from
  // useParams, so without a matching Route it fetches /funding/undefined.
  return renderWithProviders(
    <Routes>
      <Route path="/funding/:id" element={<FundingDetail />} />
    </Routes>,
    { route: '/funding/2' }
  )
}

const expectOnlyANewRequest = async () => {
  const start = await screen.findByRole('link', { name: /start funding request/i })
  expect(start).toHaveAttribute('href', '/funding/2/review')
  expect(screen.queryByRole('link', { name: /edit application/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /view application/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /process application/i })).not.toBeInTheDocument()
  expect(screen.getByText(/start your funding request/i)).toBeInTheDocument()
}

/**
 * Defect (BUG-026, CP-FUND-04): the detail page and the card disagreed on the
 * eligibility label. Both use the same rule: Failed while underwriting factors
 * are missing, otherwise the engine's own label.
 */
describe('FundingDetail eligibility label', () => {
  it('shows the engine label when nothing is missing', async () => {
    renderDetail({ engine_status: 'Review', engine_status_label: 'Manual Review Required' })

    expect(await screen.findByText('Manual Review Required')).toBeInTheDocument()
  })

  it('says Failed while underwriting factors are missing, as the card does', async () => {
    const { container } = renderDetail({ engine_status: 'Warning', engine_status_label: 'Conditional', readiness_factors: [{ label: 'Time in Business', status: 'Failed' }] })

    // Listed under Underwriting Factors and, being Failed, under What to Fix.
    await screen.findAllByText('Time in Business')
    expect(container.querySelector('.funding-detail-badge')).toHaveTextContent(/^Failed$/)
    expect(screen.queryByText('Conditional')).not.toBeInTheDocument()
  })
})

/**
 * Defect (BUG-134, CP-FUND-04): Term Loans said Failed, yet under the badge
 * "High Match" and in "Why You May Qualify" "Business profile meets our
 * lending standards" - while 7 of 8 underwriting factors were Failed. A Failed
 * option gives one answer: no match label, and the panel says what to fix
 * (the failed factors and the missing documents) instead of why it may qualify.
 */
describe('FundingDetail when the option is Failed', () => {
  const termLoanFactors = [
    { label: 'Revenue', status: 'Failed' },
    { label: 'Time in Business', status: 'Failed' },
    { label: 'Personal Credit', status: 'Weak' },
    { label: 'Business Credit', status: 'Good' },
  ]

  it('shows no match label and no reasons it may qualify', async () => {
    const { container } = renderDetail({ engine_status: 'Active', engine_status_label: 'Eligible Now' }, termLoanFactors)

    await screen.findAllByText('Revenue')
    expect(container.querySelector('.funding-detail-badge')).toHaveTextContent(/^Failed$/)
    expect(screen.queryByText('High Match')).not.toBeInTheDocument()
    expect(screen.queryByText(/why you may qualify/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Business profile meets our lending standards')).not.toBeInTheDocument()
  })

  it('lists what to fix: every failed or weak factor and the missing documents', async () => {
    renderDetail({ engine_status: 'Active', missing_documents: ['Bank Statements'] }, termLoanFactors)

    const panel = (await screen.findByRole('heading', { name: /what to fix/i })).closest('.funding-detail-panel') as HTMLElement
    expect(within(panel).getByText('Revenue')).toBeInTheDocument()
    expect(within(panel).getByText('Time in Business')).toBeInTheDocument()
    expect(within(panel).getByText('Personal Credit')).toBeInTheDocument()
    expect(within(panel).queryByText('Business Credit')).not.toBeInTheDocument()
    expect(within(panel).getByText('Bank Statements')).toBeInTheDocument()
  })

  it('still shows the match label and the reasons when nothing is missing', async () => {
    renderDetail({ engine_status: 'Active' }, [{ label: 'Business Credit', status: 'Good' }])

    expect(await screen.findByText('Business profile meets our lending standards')).toBeInTheDocument()
    expect(screen.getByText('High Match')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /why you may qualify/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /what to fix/i })).not.toBeInTheDocument()
  })
})

/**
 * Defect (BUG-025, CP-FUND-07): SPEED TO FUNDS showed "1-5 Days Days" - the
 * stored value already has its unit and the page appended " Days" again.
 */
describe('FundingDetail speed to funds', () => {
  it('shows a value that has its own unit once', async () => {
    renderDetail({ speed_to_funds: '1-5 Days' })

    expect(await screen.findByText('1-5 Days')).toBeInTheDocument()
    expect(screen.queryByText(/Days Days/)).not.toBeInTheDocument()
  })

  it('does not put Days after a value in hours', async () => {
    renderDetail({ speed_to_funds: '24-72 Hours' })

    expect(await screen.findByText('24-72 Hours')).toBeInTheDocument()
  })

  it('adds Days to a bare range', async () => {
    renderDetail({ speed_to_funds: '3-7' })

    expect(await screen.findByText('3-7 Days')).toBeInTheDocument()
  })
})

describe('FundingDetail call to action', () => {
  /**
   * Defect: an On Hold application for this option turned the card into
   * "Edit Application" ("Your funding application is On Hold. You can still
   * review and edit it.") instead of starting a new request.
   */
  it('starts a new request even while an application is still editable', async () => {
    renderDetail({
      has_funding_application: true,
      can_start_new_funding_request: false,
      funding_application_is_editable: true,
      funding_application_status: 'On Hold',
      funding_application_funding_request_id: 7,
    })

    await expectOnlyANewRequest()
    expect(screen.queryByText(/you can still review and edit it/i)).not.toBeInTheDocument()
  })

  /** Defect: an application in review offered "View Application" instead. */
  it('starts a new request even while an application is in review', async () => {
    renderDetail({ has_funding_application: true, can_start_new_funding_request: false })

    await expectOnlyANewRequest()
  })

  it('starts a new request once the previous application is settled', async () => {
    renderDetail({ has_funding_application: true, can_start_new_funding_request: true })

    await expectOnlyANewRequest()
  })

  /** Defect: an approved request with no application yet offered "Process Application". */
  it('starts a new request even when an earlier request is approved', async () => {
    renderDetail({ has_funding_application: false, can_start_new_funding_request: false })

    await expectOnlyANewRequest()
  })

  /** Defect: a pending request disabled the button ("Already applied"). */
  it('starts a new request even when an earlier request is pending', async () => {
    renderDetail({
      latest_review_status: 'Pending',
      has_funding_application: false,
      can_start_new_funding_request: false,
    })

    await expectOnlyANewRequest()
    expect(screen.queryByText(/already applied/i)).not.toBeInTheDocument()
  })

  it('does not let the borrower start when the option is not available to them', async () => {
    renderDetail({ engine_status: 'Hidden', latest_review_status: null, has_funding_application: false })

    // Still labelled, but a disabled span rather than a link.
    expect(await screen.findByText('Start Funding Request')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /start funding request/i })).not.toBeInTheDocument()
    expect(screen.getByText(/not available for your profile/i)).toBeInTheDocument()
  })
})
