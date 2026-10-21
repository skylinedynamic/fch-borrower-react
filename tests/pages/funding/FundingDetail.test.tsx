import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../../test-utils'
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

const renderDetail = (overrides: Record<string, unknown> = {}) => {
  server.use(
    http.get('*/borrower/funding/2', () => HttpResponse.json({ status: true, data: detail(overrides) })),
    http.get('*/common/funding-qualification/*/readiness-factors', () =>
      HttpResponse.json({ status: true, data: [] })
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

    await screen.findByText('Time in Business')
    expect(container.querySelector('.funding-detail-badge')).toHaveTextContent(/^Failed$/)
    expect(screen.queryByText('Conditional')).not.toBeInTheDocument()
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
