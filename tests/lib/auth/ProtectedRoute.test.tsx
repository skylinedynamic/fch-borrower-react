import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { useAuthStore } from '../../../src/store/auth'
import ProtectedRoute from '../../../src/lib/auth/ProtectedRoute'

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

  it('redirects a free-trial user away from a locked module path', () => {
    useAuthStore.setState({
      token: 'abc',
      user: { id: 1 },
      userSubscription: { is_free_trail: true },
    })
    renderAt('/credit-card-stacking')
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
