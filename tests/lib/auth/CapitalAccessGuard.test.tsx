import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../../test-utils'
import { useAuthStore } from '../../../src/store/auth'
import CapitalAccessGuard from '../../../src/lib/auth/CapitalAccessGuard'

const reset = () => useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })

const renderAt = () =>
  renderWithProviders(
    <Routes>
      <Route element={<CapitalAccessGuard />}>
        <Route path="/credit-card-stacking" element={<div>Capital Access Content</div>} />
      </Route>
    </Routes>,
    { route: '/credit-card-stacking' }
  )

describe('CapitalAccessGuard', () => {
  beforeEach(reset)
  afterEach(reset)

  it('shows the locked screen when the credit profile has not been updated', () => {
    useAuthStore.setState({ user: { id: 1, credit_profile_updated: false } })
    renderAt()
    expect(screen.queryByText('Capital Access Content')).not.toBeInTheDocument()
  })

  it('renders the protected content once the credit profile has been updated', () => {
    useAuthStore.setState({ user: { id: 1, credit_profile_updated: true } })
    renderAt()
    expect(screen.getByText('Capital Access Content')).toBeInTheDocument()
  })
})
