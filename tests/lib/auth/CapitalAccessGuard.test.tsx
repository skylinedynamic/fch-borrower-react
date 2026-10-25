import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
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

/** The profile completion endpoint, saying what Credit Card Stacking waits on. */
const mockAccess = (access: { unlocked: boolean; credit_profile_verified: boolean; tier_0_completed: boolean }) =>
  server.use(
    http.get('*/borrower/profile/completion', () =>
      HttpResponse.json({
        status: true,
        data: {
          is_complete: true,
          personal: { is_complete: true, missing_fields: [] },
          business: { is_complete: true, missing_fields: [] },
          financial: { is_complete: true, missing_fields: [] },
          credit_card_stacking: access,
        },
      })
    )
  )

/**
 * Credit Card Stacking opens once the credit profile is verified (with its
 * iSoftPull report) and Tier 0 is complete - the API decides. The user's
 * `credit_profile_updated` flag alone is not enough: submitting the form sets it.
 */
describe('CapitalAccessGuard', () => {
  beforeEach(() => {
    reset()
    try {
      localStorage.clear()
    } catch {
      // not available
    }
    useAuthStore.setState({ user: { id: 1, credit_profile_updated: true } })
  })
  afterEach(() => {
    reset()
    server.resetHandlers()
  })

  it('shows the locked screen while Tier 0 is still to complete', async () => {
    mockAccess({ unlocked: false, credit_profile_verified: true, tier_0_completed: false })
    renderAt()

    expect(await screen.findByText(/why is this still locked/i)).toBeInTheDocument()
    expect(screen.queryByText('Capital Access Content')).not.toBeInTheDocument()
  })

  it('shows the locked screen while the credit profile is not verified', async () => {
    mockAccess({ unlocked: false, credit_profile_verified: false, tier_0_completed: true })
    renderAt()

    expect(await screen.findByText(/why is this still locked/i)).toBeInTheDocument()
    expect(screen.queryByText('Capital Access Content')).not.toBeInTheDocument()
  })

  it('renders the page once both are done', async () => {
    mockAccess({ unlocked: true, credit_profile_verified: true, tier_0_completed: true })
    renderAt()

    expect(await screen.findByText('Capital Access Content')).toBeInTheDocument()
  })

  it('shows the overview skeleton while finding out, once it has been open before', async () => {
    mockAccess({ unlocked: true, credit_profile_verified: true, tier_0_completed: true })
    const first = renderAt()
    expect(await screen.findByText('Capital Access Content')).toBeInTheDocument()
    first.unmount()

    server.use(http.get('*/borrower/profile/completion', () => new Promise(() => {})))
    renderAt()

    expect(screen.getByRole('status', { name: /loading credit card stacking overview/i })).toBeInTheDocument()
  })

  it('goes back to the locked skeleton once it is locked again', async () => {
    mockAccess({ unlocked: true, credit_profile_verified: true, tier_0_completed: true })
    renderAt().unmount()
    mockAccess({ unlocked: false, credit_profile_verified: true, tier_0_completed: false })
    const second = renderAt()
    expect(await screen.findByText(/why is this still locked/i)).toBeInTheDocument()
    second.unmount()

    server.use(http.get('*/borrower/profile/completion', () => new Promise(() => {})))
    renderAt()

    expect(screen.getByRole('status', { name: /^loading credit card stacking$/i })).toBeInTheDocument()
  })

  it('shows a skeleton of the locked screen while it is still finding out', () => {
    server.use(http.get('*/borrower/profile/completion', () => new Promise(() => {})))
    renderAt()

    expect(screen.getByRole('status', { name: /loading credit card stacking/i })).toBeInTheDocument()
    expect(screen.queryByText('Capital Access Content')).not.toBeInTheDocument()
  })
})
