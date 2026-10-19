import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import { useAuthStore } from '../../../src/store/auth'
import Dashboard from '../../../src/pages/dashboard/Dashboard'

// primereact/chart renders onto a <canvas>, which jsdom doesn't implement
// (no getContext); the chart's own rendering isn't what this page's logic
// test cares about, so it's replaced with an inert placeholder.
vi.mock('primereact/chart', () => ({ Chart: () => <div data-testid="chart-stub" /> }))

afterEach(() => {
  server.resetHandlers()
  useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })
})

describe('Dashboard', () => {
  it('renders the capital access readiness status once data loads', async () => {
    useAuthStore.setState({ user: { id: 1, name: 'Jane Borrower' } })
    const dashboardData = {
      states: { funding_applications: 2, pre_qualifications: 1, total_requested_amount: 50000, total_funded_amount: 10000 },
      latest_funding_applications: [],
      latest_pre_qualifications: [],
      upcoming_meeting: [],
      invoices: [],
      tier: { id: 1, name: 'tier-1', title: 'Tier 1', tasks_under_review: 0 },
    }
    server.use(
      http.get('*/borrower/dashboard', () => HttpResponse.json({ status: true, data: dashboardData })),
      http.get('*/borrower/capital-access/overview', () =>
        HttpResponse.json({
          status: true,
          data: { readiness_score: 55, readiness_status: 'Fair', factors: [], estimated_total_access: '$20,000' },
        })
      )
    )

    renderWithProviders(<Dashboard />)

    expect(await screen.findByText(/Fair/i)).toBeInTheDocument()
  })

  it('shows the amounts on the top cards as the API formats them', async () => {
    // The page used to divide by 1000 and append K: "$37249K" for $37.2M.
    useAuthStore.setState({ user: { id: 1, name: 'Jane Borrower' } })
    server.use(
      http.get('*/borrower/dashboard', () =>
        HttpResponse.json({
          status: true,
          data: {
            states: {
              funding_applications: 2,
              funding_requests: 1,
              total_requested_amount: 37249000,
              total_funded_amount: 4326000,
              total_requested_amount_formatted: '$37.2M',
              total_funded_amount_formatted: '$4.33M',
            },
            latest_funding_applications: [],
            latest_pre_qualifications: [],
            upcoming_meeting: [],
            invoices: [],
            tier: { id: 1, name: 'tier-1', title: 'Tier 1', tasks_under_review: 0 },
          },
        })
      ),
      http.get('*/borrower/capital-access/overview', () =>
        HttpResponse.json({ status: true, data: { readiness_score: 55, readiness_status: 'Fair', factors: [], estimated_total_access: '$20,000' } })
      )
    )

    renderWithProviders(<Dashboard />)

    expect(await screen.findByText('$37.2M')).toBeInTheDocument()
    expect(screen.getByText('$4.33M')).toBeInTheDocument()
    expect(screen.queryByText(/37249K/)).not.toBeInTheDocument()
  })

  it('shows the requests ready to process from the active-funding-requests endpoint', async () => {
    // The dashboard response no longer carries them: the layout loads them on
    // every page, and this card reads the same cached query.
    useAuthStore.setState({ user: { id: 1, name: 'Jane Borrower' } })
    const requests = [
      { id: 7, requested_amount: '45000', estimated_funding_range: '$45,000', funding_type: 'Term Loan' },
      { id: 6, requested_amount: '12000', estimated_funding_range: '$12,000', funding_type: 'Line of Credit' },
    ]
    server.use(
      http.get('*/borrower/dashboard', () =>
        HttpResponse.json({
          status: true,
          data: {
            states: { funding_applications: 0, funding_requests: 2, total_requested_amount: 0, total_funded_amount: 0 },
            latest_funding_applications: [],
            latest_pre_qualifications: [],
            upcoming_meeting: [],
            invoices: [],
            tier: { id: 1, name: 'tier-1', title: 'Tier 1', tasks_under_review: 0 },
          },
        })
      ),
      http.get('*/borrower/active-funding-requests', () =>
        HttpResponse.json({
          status: true,
          message: 'ok',
          data: {
            active_approved_funding_requests: requests,
            active_approved_funding_request: requests[0],
            active_approved_funding_request_count: 2,
          },
        })
      ),
      http.get('*/borrower/capital-access/overview', () =>
        HttpResponse.json({ status: true, data: { readiness_score: 55, readiness_status: 'Fair', factors: [], estimated_total_access: '$20,000' } })
      )
    )

    renderWithProviders(<Dashboard />)

    expect(await screen.findByText('2 Applications Ready to Process')).toBeInTheDocument()
    expect(screen.getByText('Term Loan')).toBeInTheDocument()
    expect(screen.getByText('$45,000')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })
})
