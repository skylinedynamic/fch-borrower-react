import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { useAuthStore } from '../../../src/store/auth'
import HostRoute from '../../../src/lib/auth/HostRoute'

const reset = () => useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<HostRoute />}>
          <Route path="/partner-tools" element={<div>Partner Tools</div>} />
        </Route>
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('HostRoute', () => {
  beforeEach(reset)
  afterEach(reset)

  it('redirects a non-host, non-white-label user to /dashboard', () => {
    useAuthStore.setState({ user: { id: 1 } })
    renderAt('/partner-tools')
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  it('renders the content for a host user', () => {
    useAuthStore.setState({ user: { id: 1, is_host: 1 } })
    renderAt('/partner-tools')
    expect(screen.getByText('Partner Tools')).toBeInTheDocument()
  })

  it('renders the content for a White-Label partner user', () => {
    useAuthStore.setState({ user: { id: 1, partner_type: 'White-Label Partner (WL)' } })
    renderAt('/partner-tools')
    expect(screen.getByText('Partner Tools')).toBeInTheDocument()
  })
})
