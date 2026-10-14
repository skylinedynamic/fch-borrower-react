import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
// modules/auth/services first: importing lib/auth/auth first trips a circular import.
import { login } from '../../../src/modules/auth/services'
import { useAuthStore } from '../../../src/store/auth'
import { refreshSubscription, setAuth } from '../../../src/lib/auth/auth'
import { isSubscriptionRestricted } from '../../../src/lib/auth/subscriptionUtils'

vi.mock('../../../src/lib/realtime/echo', () => ({ disconnectEcho: vi.fn(), getEcho: () => null }))

/**
 * E2E-012: isSubscriptionRestricted() exempts hosts ("Hosts are never
 * restricted"), but neither login nor refreshSubscription() copied `is_host`
 * into the stored subscription, so the exemption never applied. A host whose
 * own subscription isn't Active (or a WL host with partner_payment_for_me
 * false) had the sidebar locked.
 */
const hostUser = {
  id: 5,
  name: 'Host Borrower',
  is_host: true,
  partner_type: 'White-Label Partner (WL)',
  partner_payment_for_me: false,
  subscription_status: 'Expired',
  subscription_end_date: '2020-01-01',
  is_free_trail: false,
}

describe('host borrower subscription', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: undefined, user: null, userSubscription: null })
    localStorage.clear()
  })
  afterEach(() => server.resetHandlers())

  it('login keeps is_host on the stored subscription, so a host is never restricted', async () => {
    server.use(
      http.post('*/borrower/login', () => HttpResponse.json({ status: true, data: { token: 't', user: hostUser } }))
    )

    await login('h@example.com', 'x')

    const sub = useAuthStore.getState().userSubscription
    expect(sub?.is_host).toBeTruthy()
    expect(isSubscriptionRestricted(sub)).toBe(false)
  })

  it('refreshSubscription keeps is_host too', async () => {
    setAuth('t', { id: 5, name: 'Host Borrower' } as never, true)
    server.use(
      http.get('*/common/refresh-user', () => HttpResponse.json({ status: true, data: hostUser })),
      http.get('*/borrower/user-details', () => HttpResponse.json({ status: true, data: { user: hostUser } }))
    )

    await refreshSubscription()

    const sub = useAuthStore.getState().userSubscription
    expect(sub?.is_host).toBeTruthy()
    expect(isSubscriptionRestricted(sub)).toBe(false)
  })

  it('a non-host with the same expired subscription is still restricted', async () => {
    setAuth('t', { id: 6, name: 'Borrower' } as never, true)
    const user = { ...hostUser, id: 6, is_host: false }
    server.use(
      http.get('*/common/refresh-user', () => HttpResponse.json({ status: true, data: user })),
      http.get('*/borrower/user-details', () => HttpResponse.json({ status: true, data: { user } }))
    )

    await refreshSubscription()

    expect(isSubscriptionRestricted(useAuthStore.getState().userSubscription)).toBe(true)
  })
})
