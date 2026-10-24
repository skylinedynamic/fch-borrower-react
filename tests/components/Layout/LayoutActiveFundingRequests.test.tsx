import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'

// No real socket: otherwise the test connects to whatever Reverb is running on
// the machine (VITE_REVERB_* from .env), and its result depends on that.
vi.mock('../../../src/lib/realtime/echo', () => ({
  getEcho: () => null,
  disconnectEcho: () => {},
  userChannelName: (id: number | string) => `App.Models.User.${id}`,
}))
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import Layout from '../../../src/components/Layout/Layout'
import { useAuthStore } from '../../../src/store/auth'

/**
 * The layout on every page shows the "Funding Request Approved" banner and the
 * Funding Request badge in the sidebar. Both come from the light
 * active-funding-requests endpoint: opening (or reloading) any page other than
 * the dashboard must not load the whole dashboard.
 */
let dashboardCalls = 0
let activeCalls = 0

function serve(count: number) {
  const request = { id: 7, requested_amount: '45000', estimated_funding_range: '$45,000', funding_type: 'Term Loan' }
  server.use(
    // The rest of the layout (support chat, realtime), answered so it stays quiet.
    http.get('*/borrower/assistant/config', () => HttpResponse.json({ status: true, data: { enabled: false } })),
    http.post('*/broadcasting/auth', () => HttpResponse.json({})),
    http.get('*/borrower/dashboard', () => {
      dashboardCalls += 1
      return HttpResponse.json({ status: true, data: {} })
    }),
    http.get('*/borrower/active-funding-requests', () => {
      activeCalls += 1
      return HttpResponse.json({
        status: true,
        message: 'ok',
        data: {
          active_approved_funding_requests: count ? Array.from({ length: count }, (_, i) => ({ ...request, id: 7 + i })) : [],
          active_approved_funding_request: count ? request : null,
          active_approved_funding_request_count: count,
        },
      })
    })
  )
}

function renderPage(route = '/payments') {
  return renderWithProviders(
    <Routes>
      <Route element={<Layout />}>
        <Route path="*" element={<div>Page body</div>} />
      </Route>
    </Routes>,
    { route }
  )
}

describe('Layout: approved funding requests', () => {
  beforeEach(() => {
    dashboardCalls = 0
    activeCalls = 0
    useAuthStore.setState({ token: 't', user: { id: 1, name: 'Odessa Mccall' }, userSubscription: null } as never)
  })

  it('shows the banner and the sidebar badge from the active-funding-requests endpoint alone', async () => {
    serve(1)
    renderPage()

    expect(await screen.findByText(/your funding request has been approved/i)).toBeInTheDocument()
    expect(screen.getByText('$45,000')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /^funding request\s*1$/i })).toHaveAttribute('href', '/funding-requests')
    // Banner and sidebar share one cached query: one request between them.
    expect(activeCalls).toBe(1)
    expect(dashboardCalls).toBe(0)
  })

  it('shows neither when nothing is waiting to be started', async () => {
    serve(0)
    renderPage()

    expect(await screen.findByText('Page body')).toBeInTheDocument()
    await screen.findByRole('link', { name: /^funding request$/i })
    expect(screen.queryByText(/funding request has been approved/i)).not.toBeInTheDocument()
    expect(activeCalls).toBe(1)
    expect(dashboardCalls).toBe(0)
  })
})
