import { afterEach, describe, expect, it, vi } from 'vitest'
import { delay, http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '../../test-utils'
import { server } from '../../mocks/server'
import { useAuthStore } from '../../../src/store/auth'
import Dashboard from '../../../src/pages/dashboard/Dashboard'

// primereact/chart renders onto a <canvas>, which jsdom doesn't implement
// (no getContext); the chart's own rendering isn't what this page's logic
// test cares about, so it's replaced with an inert placeholder.
vi.mock('primereact/chart', () => ({ Chart: () => <div data-testid="chart-stub" /> }))

/**
 * What the borrower dashboard shows and where it sends them. Written against
 * what a borrower sees and clicks rather than markup, so the page's design can
 * change without these changing.
 */

const baseData = {
  states: { funding_applications: 2, funding_requests: 3, pre_qualifications: 1, total_requested_amount: 50000, total_funded_amount: 10000 },
  latest_funding_applications: [] as unknown[],
  latest_pre_qualifications: [] as unknown[],
  upcoming_meeting: [] as unknown[],
  invoices: [] as unknown[],
  tier: { id: 1, name: 'Tier 1', title: 'Starter Credit', tasks_under_review: 4 },
  fico_score: null as number | null,
  active_approved_funding_requests: [] as unknown[],
  active_approved_funding_request: null as unknown,
  active_approved_funding_request_count: 0,
}

const baseOverview = { readiness_score: 55, readiness_status: 'Fair', factors: [], estimated_total_access: '$20,000', current_play: null }

function serve(data: Partial<typeof baseData> = {}, overview: Record<string, unknown> = {}) {
  server.use(
    http.get('*/borrower/dashboard', () => HttpResponse.json({ status: true, data: { ...baseData, ...data } })),
    http.get('*/borrower/capital-access/overview', () =>
      HttpResponse.json({ status: true, data: { ...baseOverview, ...overview } })
    )
  )
}

function signIn(user: Record<string, unknown> = {}, subscription: Record<string, unknown> | null = null) {
  useAuthStore.setState({ user: { id: 1, name: 'Jane Borrower', ...user }, userSubscription: subscription })
}

const Landing = ({ name }: { name: string }) => <div>{name} page</div>

function renderDashboard() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/invoices" element={<Landing name="Invoices" />} />
      <Route path="/credit-card-stacking" element={<Landing name="Credit Card Stacking" />} />
      <Route path="/my-applications" element={<Landing name="My Applications" />} />
      <Route path="/appointment" element={<Landing name="Appointment" />} />
      <Route path="/fund-application/:id" element={<Landing name="Fund Application" />} />
    </Routes>
  )
}

/** Resolves once the dashboard has data on screen. */
const loaded = () => screen.findByText(/welcome back, jane borrower/i)

afterEach(() => {
  server.resetHandlers()
  useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })
})

describe('Dashboard', () => {
  describe('loading and errors', () => {
    it('shows the dashboard-shaped skeleton while it loads, then the real thing', async () => {
      signIn()
      server.use(
        http.get('*/borrower/dashboard', async () => {
          await delay(150)
          return HttpResponse.json({ status: true, data: baseData })
        }),
        http.get('*/borrower/capital-access/overview', () => HttpResponse.json({ status: true, data: baseOverview }))
      )
      renderDashboard()

      expect(screen.getByRole('status', { name: /loading dashboard/i })).toBeInTheDocument()
      await loaded()
      expect(screen.queryByRole('status', { name: /loading dashboard/i })).toBeNull()
    })

    it('says so when the dashboard cannot be loaded', async () => {
      signIn()
      server.use(
        http.get('*/borrower/dashboard', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
        http.get('*/borrower/capital-access/overview', () => HttpResponse.json({ status: true, data: baseOverview }))
      )
      renderDashboard()

      expect(await screen.findByText(/error loading dashboard/i)).toBeInTheDocument()
    })
  })

  describe('headline figures', () => {
    it('greets the borrower and shows the four totals', async () => {
      signIn()
      serve()
      renderDashboard()
      await loaded()

      for (const [label, value] of [
        ['Funding Applications', '2'],
        ['Total Funding Requests', '3'],
        ['Total Requested Amount', '$50K'],
        ['Total Funded Amount', '$10K'],
      ]) {
        const card = screen.getByText(label).closest('[data-kpi]') as HTMLElement
        expect(card).not.toBeNull()
        expect(card).toHaveTextContent(value)
      }
    })

    it('shows $0 funded rather than $0K', async () => {
      signIn()
      serve({ states: { ...baseData.states, total_funded_amount: 0 } })
      renderDashboard()
      await loaded()

      expect(screen.getByText('Total Funded Amount').closest('[data-kpi]')).toHaveTextContent('$0')
      expect(screen.getByText('Total Funded Amount').closest('[data-kpi]')).not.toHaveTextContent('$0K')
    })
  })

  describe('pending invoice alert', () => {
    const unpaid = { id: 1, invoice_id: 'INV-001', status: 'Unpaid', payment_amount: '1250', currency_symbol: '$' }

    it('asks a restricted borrower to pay, and takes them to their invoices', async () => {
      const user = userEvent.setup()
      signIn({}, { subscription_status: 'inactive' })
      serve({ invoices: [unpaid] })
      renderDashboard()

      expect(await screen.findByText(/you currently have a pending invoice/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /view & pay invoice$/i }))
      expect(await screen.findByText('Invoices page')).toBeInTheDocument()
    })

    it('draws attention to itself so the borrower notices it', async () => {
      // The breathing animation is tied to this marker (see Dashboard.css).
      signIn({}, { subscription_status: 'inactive' })
      serve({ invoices: [unpaid] })
      renderDashboard()

      const title = await screen.findByText(/you currently have a pending invoice/i)
      expect(title.closest('[role="alert"]')).toHaveClass('db-alert', 'is-attention')
    })

    it('speaks in the plural for more than one pending invoice', async () => {
      signIn({}, { subscription_status: 'inactive' })
      serve({ invoices: [unpaid, { ...unpaid, id: 2, invoice_id: 'INV-002' }] })
      renderDashboard()

      expect(await screen.findByText(/you currently have pending invoices/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view & pay invoices/i })).toBeInTheDocument()
    })

    it('is shown to a white-label borrower even with an active subscription', async () => {
      signIn({ partner_type: 'White-Label Partner (WL)' }, { subscription_status: 'active' })
      serve({ invoices: [unpaid] })
      renderDashboard()

      expect(await screen.findByText(/you currently have a pending invoice/i)).toBeInTheDocument()
    })

    it('is not shown to an active direct borrower, or when everything is paid', async () => {
      signIn({}, { subscription_status: 'active' })
      serve({ invoices: [unpaid] })
      const { unmount } = renderDashboard()
      await loaded()
      expect(screen.queryByText(/you currently have/i)).toBeNull()
      unmount()

      signIn({}, { subscription_status: 'inactive' })
      serve({ invoices: [{ ...unpaid, status: 'Paid' }] })
      renderDashboard()
      await loaded()
      expect(screen.queryByText(/you currently have/i)).toBeNull()
    })
  })

  describe('capital access', () => {
    it('shows the readiness score, status and estimated access, and starts a strategy', async () => {
      const user = userEvent.setup()
      signIn()
      serve()
      renderDashboard()
      await loaded()

      const widget = screen.getByText('Funding Readiness Overview').closest('[data-widget="capital-access"]') as HTMLElement
      expect(widget).toHaveTextContent('55')
      expect(widget).toHaveTextContent('Fair')
      expect(widget).toHaveTextContent('$20,000')

      await user.click(within(widget).getByRole('button', { name: /choose strategy/i }))
      expect(await screen.findByText('Credit Card Stacking page')).toBeInTheDocument()
    })

    describe('before the borrower has paid', () => {
      // Nothing to start until the payment is made: the pending-invoice alert
      // is the way forward, not the strategy button.
      const unpaid = { id: 1, invoice_id: 'INV-001', status: 'Unpaid', payment_amount: '1250', currency_symbol: '$' }

      it('has no Choose Strategy button while an invoice is waiting to be paid', async () => {
        signIn({}, { subscription_status: 'inactive' })
        serve({ invoices: [unpaid] })
        renderDashboard()
        await loaded()

        expect(screen.queryByRole('button', { name: /choose strategy/i })).toBeNull()
        // The rest of the card is still there.
        expect(screen.getByText(/start your capital access strategy/i)).toBeInTheDocument()
      })

      it('has no Choose Strategy button for a white-label borrower with an unpaid invoice', async () => {
        signIn({ partner_type: 'White-Label Partner (WL)' }, { subscription_status: 'active' })
        serve({ invoices: [unpaid] })
        renderDashboard()
        await loaded()

        expect(screen.queryByRole('button', { name: /choose strategy/i })).toBeNull()
      })

      it('has no Choose Strategy button while the subscription is not active', async () => {
        signIn({}, { subscription_status: 'inactive' })
        serve()
        renderDashboard()
        await loaded()

        expect(screen.queryByRole('button', { name: /choose strategy/i })).toBeNull()
      })

      it('shows the button again once everything is paid', async () => {
        signIn({ partner_type: 'White-Label Partner (WL)' }, { subscription_status: 'active' })
        serve({ invoices: [{ ...unpaid, status: 'Paid' }] })
        renderDashboard()
        await loaded()

        expect(screen.getByRole('button', { name: /choose strategy/i })).toBeInTheDocument()
      })
    })

    it('offers to resume a strategy already under way', async () => {
      signIn()
      serve({}, { current_play: { id: 9 } })
      renderDashboard()
      await loaded()

      expect(screen.getByRole('button', { name: /resume strategy/i })).toBeInTheDocument()
      expect(screen.getByText(/continue your funding journey/i)).toBeInTheDocument()
    })
  })

  describe('credit score and tier', () => {
    it('shows the FICO score once there is one', async () => {
      signIn()
      serve({ fico_score: 720 })
      renderDashboard()
      await loaded()

      expect(screen.getByText(/your current credit score is 720/i)).toBeInTheDocument()
    })

    it('says plainly when there is no score yet', async () => {
      signIn()
      serve({ fico_score: null })
      renderDashboard()
      await loaded()

      expect(screen.getByText(/haven't started credit scoring yet/i)).toBeInTheDocument()
    })

    it('shows the current tier and how many tasks are under review', async () => {
      signIn()
      serve()
      renderDashboard()
      await loaded()

      const tier = screen.getByText('Current Tier Status').closest('[data-widget="tier"]') as HTMLElement
      expect(tier).toHaveTextContent('Tier 1')
      expect(tier).toHaveTextContent('Starter Credit')
      expect(within(tier).getByText('Tasks Under Review').closest('[data-stat]')).toHaveTextContent('4')
    })
  })

  describe('applications', () => {
    it('lists recent pre-qualifications and funding applications', async () => {
      signIn()
      serve({
        latest_pre_qualifications: [
          { id: 1, purpose_of_funding: 'Working Capital', industry_type: 'Retail', business_structure: 'LLC', funding_requested_amount: '25000', formatted_created_at: 'Oct 01, 2026', status: 'Approved', status_class: 'success' },
        ],
        latest_funding_applications: [
          { id: 2, purpose_of_funds: 'Equipment', entity_type: 'Corporation', industry_type: 'Manufacturing', requested_amount: '80000', total_funded_amount: '40000', formatted_created_at: 'Sep 20, 2026', status: 'In Review', status_class: 'warning' },
        ],
      })
      renderDashboard()
      await loaded()

      const preQual = screen.getByText('Pre-Qualification Applications').closest('[data-widget="pre-qualifications"]') as HTMLElement
      for (const text of ['Working Capital', 'Oct 01, 2026', 'Retail', 'LLC', '$25,000', 'Approved']) {
        expect(preQual).toHaveTextContent(text)
      }

      const funding = screen.getByText('Recent Funding Applications').closest('[data-widget="funding-applications"]') as HTMLElement
      for (const text of ['Equipment', 'Sep 20, 2026', 'Corporation', 'Manufacturing', '$80,000', '$40,000', 'In Review']) {
        expect(funding).toHaveTextContent(text)
      }
    })

    it('says when there are none, and links through to all applications', async () => {
      const user = userEvent.setup()
      signIn()
      serve()
      renderDashboard()
      await loaded()

      expect(screen.getByText('No Pre-Qualification Applications')).toBeInTheDocument()
      expect(screen.getByText('No Funding Applications')).toBeInTheDocument()

      const preQual = screen.getByText('Pre-Qualification Applications').closest('[data-widget="pre-qualifications"]') as HTMLElement
      await user.click(within(preQual).getByRole('button', { name: /view all/i }))
      expect(await screen.findByText('My Applications page')).toBeInTheDocument()
    })
  })

  describe('approved funding requests', () => {
    const requests = [
      { id: 5, funding_type: 'Line of Credit', requested_amount: 30000 },
      { id: 6, funding_type: 'Term Loan', requested_amount: 75000 },
    ]

    it('is absent when nothing is approved', async () => {
      signIn()
      serve()
      renderDashboard()
      await loaded()

      expect(screen.queryByRole('button', { name: /process funding application/i })).toBeNull()
    })

    it('sends the borrower to complete the funding application for an approved request', async () => {
      const user = userEvent.setup()
      signIn()
      serve({ active_approved_funding_requests: [requests[0]], active_approved_funding_request: requests[0], active_approved_funding_request_count: 1 })
      renderDashboard()
      await loaded()

      expect(screen.getByText('Application Ready to Process')).toBeInTheDocument()
      expect(screen.getByText('Line of Credit')).toBeInTheDocument()
      expect(screen.getByText('$30,000')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /process funding application/i }))
      expect(await screen.findByText('Fund Application page')).toBeInTheDocument()
    })

    it('pages through several approved requests', async () => {
      const user = userEvent.setup()
      signIn()
      serve({ active_approved_funding_requests: requests, active_approved_funding_request: requests[0], active_approved_funding_request_count: 2 })
      renderDashboard()
      await loaded()

      expect(screen.getByText('2 Applications Ready to Process')).toBeInTheDocument()
      expect(screen.getByText('1 / 2')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: /next/i }))

      expect(screen.getByText('2 / 2')).toBeInTheDocument()
      expect(screen.getByText('Term Loan')).toBeInTheDocument()
      expect(screen.getByText('$75,000')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    })
  })

  describe('meetings, invoices and help', () => {
    it('lists upcoming meetings and offers to schedule one', async () => {
      const user = userEvent.setup()
      signIn()
      serve({ upcoming_meeting: [{ id: 1, subject: 'Funding review call', meeting_type: 'Zoom', appointment_date: '2026-10-15T14:30:00' }] })
      renderDashboard()
      await loaded()

      const meetings = screen.getByText('Upcoming Meetings').closest('[data-widget="meetings"]') as HTMLElement
      expect(meetings).toHaveTextContent('Funding review call')
      expect(meetings).toHaveTextContent('Zoom')
      expect(meetings).toHaveTextContent('15')

      await user.click(within(meetings).getByRole('button', { name: /schedule meeting/i }))
      expect(await screen.findByText('Appointment page')).toBeInTheDocument()
    })

    it('says when no meetings are booked', async () => {
      signIn()
      serve()
      renderDashboard()
      await loaded()

      expect(screen.getByText('No Upcoming Meetings')).toBeInTheDocument()
    })

    it('lists invoices only when there are some', async () => {
      signIn({}, { subscription_status: 'active' })
      serve({ invoices: [{ id: 1, invoice_id: 'INV-001', status: 'Paid', payment_amount: '1250', currency_symbol: '$' }] })
      const { unmount } = renderDashboard()
      await loaded()

      const invoices = screen.getByText('Invoices').closest('[data-widget="invoices"]') as HTMLElement
      expect(invoices).toHaveTextContent('INV-001')
      expect(invoices).toHaveTextContent('$1,250.00')
      expect(invoices).toHaveTextContent('Paid')
      unmount()

      serve({ invoices: [] })
      renderDashboard()
      await loaded()
      expect(document.querySelector('[data-widget="invoices"]')).toBeNull()
    })

    it('points the borrower to support', async () => {
      const user = userEvent.setup()
      signIn()
      serve()
      renderDashboard()
      await loaded()

      await user.click(screen.getByRole('button', { name: /contact support/i }))
      expect(await screen.findByText('Appointment page')).toBeInTheDocument()
    })
  })
})
