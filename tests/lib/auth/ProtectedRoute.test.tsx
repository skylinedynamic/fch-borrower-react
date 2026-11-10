import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { useAuthStore } from '../../../src/store/auth'
import ProtectedRoute from '../../../src/lib/auth/ProtectedRoute'
import { SUBSCRIPTION_STATUS_CANCELLED } from '../../../src/config/subscriptionConfig'

const daysFromToday = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const reset = () => useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path={path} element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('ProtectedRoute', () => {
  beforeEach(reset)
  afterEach(reset)

  it('redirects to /login when there is no token', () => {
    renderAt('/settings')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders the protected content when authenticated with no subscription restrictions', () => {
    useAuthStore.setState({ token: 'abc', user: { id: 1 } })
    renderAt('/settings')
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects a restricted (unpaid enrollment) subscription away from a disallowed path', () => {
    useAuthStore.setState({
      token: 'abc',
      user: { id: 1 },
      userSubscription: { partner_type: 'White-Label Partner (WL)', partner_payment_for_me: false },
    })
    renderAt('/settings')
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  it('lets a restricted subscription reach an allowed path (e.g. /invoices)', () => {
    useAuthStore.setState({
      token: 'abc',
      user: { id: 1 },
      userSubscription: { partner_type: 'White-Label Partner (WL)', partner_payment_for_me: false },
    })
    renderAt('/invoices')
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('lets a restricted (payment pending) subscription reach the notifications page', () => {
    // The header bell works on every plan, so its "View all" link must not
    // bounce the borrower back to the dashboard.
    useAuthStore.setState({
      token: 'abc',
      user: { id: 1 },
      userSubscription: { partner_type: 'White-Label Partner (WL)', partner_payment_for_me: false },
    })
    renderAt('/notifications')
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  // BUG-069: a cancelled subscription keeps full access until its end date.
  describe('after the borrower cancels', () => {
    const cancelled = (subscription_end_date: string) =>
      useAuthStore.setState({
        token: 'abc',
        user: { id: 1 },
        userSubscription: { subscription_status: SUBSCRIPTION_STATUS_CANCELLED, subscription_end_date },
      })

    it.each(['/documents', '/profile', '/billing-details', '/credit-card-stacking'])(
      'still opens %s before the end date',
      (path) => {
        cancelled(daysFromToday(10))
        renderAt(path)
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      }
    )

    it.each(['/profile', '/invoices', '/payments', '/billing-details', '/notifications'])(
      'keeps %s open once the end date has passed',
      (path) => {
        cancelled(daysFromToday(-1))
        renderAt(path)
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      }
    )

    it.each(['/documents', '/funding-request', '/credit-card-stacking', '/appointment'])(
      'sends %s back to the dashboard once the end date has passed',
      (path) => {
        cancelled(daysFromToday(-1))
        renderAt(path)
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
      }
    )
  })

  it('lets a free-trial user reach the notifications page', () => {
    useAuthStore.setState({
      token: 'abc',
      user: { id: 1 },
      userSubscription: { is_free_trail: true },
    })
    renderAt('/notifications')
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects a free-trial user away from a locked module path', () => {
    useAuthStore.setState({
      token: 'abc',
      user: { id: 1 },
      userSubscription: { is_free_trail: true },
    })
    renderAt('/credit-card-stacking')
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  // BUG-111: Billing Details is locked in the menu, but its URL opened the page (and a "Server Error").
  it('redirects a free-trial user away from Billing Details, like the other locked pages', () => {
    useAuthStore.setState({
      token: 'abc',
      user: { id: 1 },
      userSubscription: { is_free_trail: true },
    })
    renderAt('/billing-details')
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  it('lets a free-trial user reach a path that is not locked', () => {
    useAuthStore.setState({
      token: 'abc',
      user: { id: 1 },
      userSubscription: { is_free_trail: true },
    })
    renderAt('/settings')
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
