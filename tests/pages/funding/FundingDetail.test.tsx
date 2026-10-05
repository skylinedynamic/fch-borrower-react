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
 * The page has to distinguish two situations that look identical in the raw
 * data - the borrower has an application for this option, and the last request
 * was approved - but mean opposite things:
 *
 *   still running  -> the application is theirs to work on: show it to them.
 *   settled        -> it has left their hands (with a lender, funded, closed,
 *                     denied), so there is nothing left to open. Offering
 *                     "View Application" parks them on a file they cannot act
 *                     on; what they actually want is to apply again.
 *
 * The server decides which it is and says so in `can_start_new_funding_request`,
 * so the page never has to carry its own copy of the status list.
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

describe('FundingDetail call to action', () => {
  it('points the borrower at an application that is still theirs to work on', async () => {
    renderDetail({ has_funding_application: true, can_start_new_funding_request: false })

    expect(await screen.findByRole('link', { name: /view application/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /start funding request/i })).not.toBeInTheDocument()
  })

  it('offers a fresh request once the previous application has left the borrower\'s hands', async () => {
    // Approved request, application exists - but it is with a lender, funded,
    // closed or denied, so the server says a new request is allowed.
    renderDetail({ has_funding_application: true, can_start_new_funding_request: true })

    expect(await screen.findByRole('link', { name: /start funding request/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /view application/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /process application/i })).not.toBeInTheDocument()
  })

  it('stops telling the borrower to finish an application that is already settled', async () => {
    renderDetail({ has_funding_application: true, can_start_new_funding_request: true })

    expect(await screen.findByRole('link', { name: /start funding request/i })).toBeInTheDocument()
    expect(screen.queryByText(/please proceed with the final funding application/i)).not.toBeInTheDocument()
    expect(screen.getByText(/start your funding request/i)).toBeInTheDocument()
  })

  it('still sends an approved request with no application yet to the application form', async () => {
    renderDetail({ has_funding_application: false, can_start_new_funding_request: false })

    expect(await screen.findByRole('link', { name: /process application/i })).toBeInTheDocument()
  })

  it('leaves a pending request waiting rather than offering anything', async () => {
    renderDetail({
      latest_review_status: 'Pending',
      has_funding_application: false,
      can_start_new_funding_request: false,
    })

    // The call to action is still labelled, but rendered as a disabled span
    // rather than a link - there is nothing to do until the request is decided.
    expect(await screen.findByText('Start Funding Request')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /start funding request/i })).not.toBeInTheDocument()
  })
})
