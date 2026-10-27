import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { fireEvent, renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import Sidebar from '../../../src/components/Layout/Sidebar'
import ProtectedRoute from '../../../src/lib/auth/ProtectedRoute'
import { useAuthStore } from '../../../src/store/auth'
import { PARTNER_TYPES, SUBSCRIPTION_STATUS_TYPES } from '../../../src/config/partnerTypeOptions'

vi.mock('../../../src/modules/dashboard', () => ({
  useActiveFundingRequests: () => ({ data: null, isLoading: false }),
}))

/**
 * BUG-033: a restricted client's locked menus did nothing when clicked, and a
 * locked page silently bounced to the Dashboard - no reason given. Both now
 * open a modal that explains it, without blaming the partner.
 */
const ACTIVATION = { partner_type: PARTNER_TYPES.WHITE_LABEL, partner_payment_for_me: false, subscription_status: SUBSCRIPTION_STATUS_TYPES.ACTIVE }
const EXPIRED = { partner_type: PARTNER_TYPES.WHITE_LABEL, partner_payment_for_me: true, subscription_status: SUBSCRIPTION_STATUS_TYPES.EXPIRED }

const as = (userSubscription: Record<string, unknown>) =>
  useAuthStore.setState({ token: 't', user: { id: 1, name: 'Client One' }, userSubscription } as never)

describe('Sidebar - why a menu is locked (BUG-033)', () => {
  beforeEach(() => {
    server.use(
      http.get('*/common/notifications', () => HttpResponse.json({ status: true, data: [], meta: { unread_count: 0 } })),
      http.get('*/borrower/profile/completion', () => HttpResponse.json({ status: true, data: null }))
    )
  })
  afterEach(() => useAuthStore.setState({ token: undefined, user: null, userSubscription: null } as never))

  it('explains a locked menu while the account is being activated', async () => {
    const user = userEvent.setup()
    as(ACTIVATION)
    renderWithProviders(<Sidebar />)

    // fireEvent: the menu's items re-mount on every sidebar render, so a
    // multi-event user.click can land on an item a settling query replaced.
    fireEvent.click(screen.getByRole('link', { name: /^funding$/i }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/your account is being activated/i)
    expect(dialog).not.toHaveTextContent(/partner/i)

    await user.click(screen.getByRole('button', { name: /got it/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('explains a locked menu once the subscription is no longer active', async () => {
    as(EXPIRED)
    renderWithProviders(<Sidebar />)

    fireEvent.click(screen.getByRole('link', { name: /^documents/i }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/your subscription is not active/i)
    expect(screen.getByRole('link', { name: /view invoices/i })).toHaveAttribute('href', '/invoices')
  })

  it('explains the locked Credit Builder group too', async () => {
    const user = userEvent.setup()
    as(ACTIVATION)
    renderWithProviders(<Sidebar />)

    await user.click(screen.getByRole('button', { name: /credit builder/i }))

    expect(await screen.findByRole('dialog')).toHaveTextContent(/your account is being activated/i)
  })

  it('opens no modal for a free-trial lock', async () => {
    as({ is_free_trail: true })
    renderWithProviders(<Sidebar />)

    fireEvent.click(screen.getByRole('link', { name: /^invoices/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('explains why a locked page sent the client back to the Dashboard', async () => {
    as(ACTIVATION)
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/funding" element={<p>Funding page</p>} />
        </Route>
        <Route path="/dashboard" element={<Sidebar />} />
      </Routes>,
      { route: '/funding' }
    )

    expect(await screen.findByRole('dialog')).toHaveTextContent(/your account is being activated/i)
    expect(screen.queryByText('Funding page')).not.toBeInTheDocument()
  })
})
