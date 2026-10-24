import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { createTestQueryClient } from '../../test-utils'
import { createFakeEcho, type FakeEcho } from '../../mocks/fakeEcho'
import { setAuthState, clearAuthState } from '../../../src/store/auth'
import { queryKeys } from '../../../src/lib/query/queryKeys'

let fake: FakeEcho

vi.mock('../../../src/lib/realtime/echo', () => ({
  getEcho: () => fake.echo,
  disconnectEcho: () => {},
  userChannelName: (id: number | string) => `App.Models.User.${id}`,
}))

import { useNotificationStream } from '../../../src/modules/notifications/useNotificationStream'

const CHANNEL = 'App.Models.User.5'

const broadcast = (type: string) => ({
  id: `n-${type}`,
  type,
  title: 'Funding Request Approved',
  body: 'Your funding request has been approved.',
  url: '/funding-requests/9',
  icon: 'ri-hand-coin-line',
  category: 'funding',
  created_at: new Date().toISOString(),
})

const mountStream = () => {
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  renderHook(() => useNotificationStream(), { wrapper })
  return { invalidate }
}

const invalidatedKeys = (invalidate: { mock: { calls: unknown[][] } }) =>
  invalidate.mock.calls.map(([filters]: any[]) => JSON.stringify(filters?.queryKey))

const bannerRefreshed = (invalidate: { mock: { calls: unknown[][] } }) =>
  invalidatedKeys(invalidate).includes(JSON.stringify(queryKeys.dashboard.activeFundingRequests()))

/**
 * The approved-request banner and the sidebar badge read
 * GET /borrower/active-funding-requests, cached for 5 minutes.
 *
 * Defect: when a funding request was approved, the borrower got the live
 * `borrower.funding_request.status_changed` push, but that endpoint was not
 * called until the cache went stale or the page was hard-reloaded. That push
 * (host or partner, any status) now calls it straight away - and only that
 * endpoint, not the whole dashboard.
 */
describe('useNotificationStream', () => {
  beforeEach(() => {
    fake = createFakeEcho()
    setAuthState({ token: 't', user: { id: 5 } as any })
  })

  afterEach(() => {
    clearAuthState()
    vi.clearAllMocks()
  })

  it('calls active-funding-requests when a funding request status push arrives', () => {
    const { invalidate } = mountStream()

    act(() => fake.emitNotification(CHANNEL, broadcast('borrower.funding_request.status_changed')))

    expect(bannerRefreshed(invalidate)).toBe(true)
    // Only the banner's light endpoint, not the whole dashboard.
    expect(invalidatedKeys(invalidate)).not.toContain(JSON.stringify(queryKeys.dashboard.all))
  })

  it.each([
    'borrower.funding_application.submitted',
    'borrower.funding_application.reminder',
    'borrower.invoice.created',
  ])('does not call it for a %s push', (type) => {
    const { invalidate } = mountStream()

    act(() => fake.emitNotification(CHANNEL, broadcast(type)))

    expect(bannerRefreshed(invalidate)).toBe(false)
  })

  it('calls it after a reconnect, to catch an approval missed while offline', () => {
    const { invalidate } = mountStream()

    act(() => fake.setConnectionState('unavailable'))
    act(() => fake.setConnectionState('connected'))

    expect(bannerRefreshed(invalidate)).toBe(true)
  })

  /**
   * Defect: the first connection after a page load counted as a "reconnect",
   * so every page load called active-funding-requests twice (once on load,
   * once when the socket came up).
   */
  it('does not call it when the socket first connects on page load', () => {
    fake = createFakeEcho('connecting')
    const { invalidate } = mountStream()

    act(() => fake.setConnectionState('connected'))

    expect(bannerRefreshed(invalidate)).toBe(false)
  })
})
