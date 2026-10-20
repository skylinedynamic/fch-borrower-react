import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { act, renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import { createFakeEcho, type FakeEcho } from '../../mocks/fakeEcho'
import { useAuthStore } from '../../../src/store/auth'

let fake: FakeEcho

vi.mock('../../../src/lib/realtime/echo', () => ({
  getEcho: () => fake.echo,
  disconnectEcho: () => {},
  userChannelName: (id: number | string) => `App.Models.User.${id}`,
}))

import Layout from '../../../src/components/Layout/Layout'

/**
 * The "Funding Request Approved" banner comes from
 * GET /borrower/active-funding-requests. When the host or the partner approves
 * a request, the borrower gets `borrower.funding_request.status_changed` over
 * Reverb; that push alone must make the layout call the endpoint again and
 * show the banner - no reload. Other pushes do not call it.
 */
const CHANNEL = 'App.Models.User.1'
const approved = { id: 7, requested_amount: '40000', estimated_funding_range: '$2,000 - $100,000', funding_type: 'Business Credit Building' }

let pending: typeof approved[] = []
let activeCalls = 0

const liveNotification = (type: string) => ({
  id: `n-${Math.random()}`,
  type,
  title: 'Funding request Approved',
  body: 'Your funding request #7 is now Approved.',
  url: '/funding-requests/7',
  icon: 'ri-hand-coin-line',
  category: 'funding',
  created_at: new Date().toISOString(),
})

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route element={<Layout />}>
        <Route path="*" element={<div>Page body</div>} />
      </Route>
    </Routes>,
    { route: '/dashboard' }
  )
}

describe('Layout: approved banner in real time', () => {
  beforeEach(() => {
    fake = createFakeEcho()
    pending = []
    activeCalls = 0
    useAuthStore.setState({ token: 't', user: { id: 1, name: 'Michael Chen' }, userSubscription: null } as never)
    server.use(
      http.get('*/borrower/assistant/config', () => HttpResponse.json({ status: true, data: { enabled: false } })),
      http.post('*/broadcasting/auth', () => HttpResponse.json({})),
      http.get('*/common/notifications', () =>
        HttpResponse.json({ status: true, data: [], meta: { current_page: 1, last_page: 1, per_page: 5, total: 0, unread_count: 0 } })
      ),
      http.get('*/borrower/active-funding-requests', () => {
        activeCalls += 1
        return HttpResponse.json({
          status: true,
          message: 'ok',
          data: {
            active_approved_funding_requests: pending,
            active_approved_funding_request: pending[0] ?? null,
            active_approved_funding_request_count: pending.length,
          },
        })
      })
    )
  })

  afterEach(() => vi.clearAllMocks())

  it('shows the banner as soon as the approval arrives over Reverb', async () => {
    renderPage()
    await waitFor(() => expect(activeCalls).toBe(1))
    expect(screen.queryByText(/your funding request has been approved/i)).not.toBeInTheDocument()

    // Host/partner approves: the API now has it, and Reverb tells the borrower.
    pending = [approved]
    act(() => fake.emitNotification(CHANNEL, liveNotification('borrower.funding_request.status_changed')))

    expect(await screen.findByText(/your funding request has been approved/i)).toBeInTheDocument()
    expect(screen.getByText('$2,000 - $100,000')).toBeInTheDocument()
    expect(activeCalls).toBe(2)
  })

  it('calls the endpoint for any status change push - a rejection shows no banner', async () => {
    renderPage()
    await waitFor(() => expect(activeCalls).toBe(1))

    // Same push type for Rejected; the endpoint still returns nothing waiting.
    act(() => fake.emitNotification(CHANNEL, liveNotification('borrower.funding_request.status_changed')))

    await waitFor(() => expect(activeCalls).toBe(2))
    expect(screen.queryByText(/your funding request has been approved/i)).not.toBeInTheDocument()
  })

  it.each(['borrower.funding_application.submitted', 'borrower.invoice.created'])(
    'does not call the endpoint again for a %s push',
    async (type) => {
      renderPage()
      await waitFor(() => expect(activeCalls).toBe(1))

      act(() => fake.emitNotification(CHANNEL, liveNotification(type)))

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(activeCalls).toBe(1)
    }
  )
})
