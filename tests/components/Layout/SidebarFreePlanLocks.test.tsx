import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import Sidebar from '../../../src/components/Layout/Sidebar'
import { useAuthStore } from '../../../src/store/auth'

vi.mock('../../../src/modules/dashboard', () => ({
  useActiveFundingRequests: () => ({ data: null, isLoading: false }),
}))

const hasLock = (el: HTMLElement) => !!el.querySelector('.ri-lock-line')

/**
 * BUG-110: on the free plan, Capital Access, Invoices, Payments, Billing
 * Details and Resource Hub showed a lock, but Credit Builder's Overview,
 * Step-By-Step Guide and Credit Accounts did not - though clicking them went
 * nowhere (the routes are locked).
 */
describe('Sidebar on the free plan', () => {
  beforeEach(() => {
    server.use(http.get('*/common/notifications', () => HttpResponse.json({ status: true, data: [], meta: { unread_count: 0 } })))
    useAuthStore.setState({ token: 't', user: { id: 1, name: 'Free Client' }, userSubscription: { is_free_trail: true } } as never)
  })

  it('locks Credit Builder and each of its items, like the other locked modules', () => {
    renderWithProviders(<Sidebar />)

    expect(hasLock(screen.getByRole('button', { name: /credit builder/i }))).toBe(true)
    for (const name of [/^overview/i, /^step-by-step guide/i, /^credit accounts/i]) {
      expect(hasLock(screen.getByRole('link', { name, hidden: true }))).toBe(true)
    }
    expect(hasLock(screen.getByRole('link', { name: /^invoices/i }))).toBe(true)
  })

  it('shows no lock on Credit Builder for a paid plan', () => {
    useAuthStore.setState({ userSubscription: null } as never)
    renderWithProviders(<Sidebar />)

    expect(hasLock(screen.getByRole('button', { name: /credit builder/i }))).toBe(false)
    expect(hasLock(screen.getByRole('link', { name: /^overview/i, hidden: true }))).toBe(false)
  })
})
