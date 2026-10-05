import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import Sidebar from '../../../src/components/Layout/Sidebar'
import { useAuthStore } from '../../../src/store/auth'
import { PARTNER_TYPES } from '../../../src/config/partnerTypeOptions'

vi.mock('../../../src/modules/dashboard', () => ({
  useDashboard: () => ({ data: null, isLoading: false }),
}))

let countRequests = 0
const unread = (count: number) =>
  server.use(
    http.get('*/common/notifications/unread-count', () => {
      countRequests += 1
      return HttpResponse.json({ status: true, data: { unread_count: count } })
    })
  )

describe('Sidebar "Notification" menu', () => {
  beforeEach(() => {
    countRequests = 0
    useAuthStore.setState({ token: 't', user: { id: 1, name: 'Odessa Mccall' }, userSubscription: null } as never)
  })

  it('links to the notifications page with the unread count', async () => {
    unread(4)
    renderWithProviders(<Sidebar />)

    // The menu re-renders once the count arrives, so find the link by its final name.
    const link = await screen.findByRole('link', { name: /^notification\s*4$/i })
    expect(link).toHaveAttribute('href', '/notifications')
  })

  it('shows no badge when everything is read', async () => {
    unread(0)
    renderWithProviders(<Sidebar />)

    await waitFor(() => expect(countRequests).toBeGreaterThan(0))

    // Exactly "Notification": no "0" badge appended.
    expect(await screen.findByRole('link', { name: /^notification$/i })).toHaveAttribute('href', '/notifications')
  })

  it('stays open on a restricted account (the bell works there too)', () => {
    unread(0)
    // An unpaid white-label enrolment restricts the borrower's menu.
    useAuthStore.setState({ userSubscription: { partner_type: PARTNER_TYPES.WHITE_LABEL, partner_payment_for_me: false } } as never)
    const { container } = renderWithProviders(<Sidebar />)

    const hasLock = (link: HTMLElement) => !!link.querySelector('.ri-lock-line')
    // Sanity check: the account really is restricted (Documents is locked) ...
    expect(hasLock(screen.getByRole('link', { name: /^documents/i }))).toBe(true)
    // ... but Notification is not.
    expect(hasLock(screen.getByRole('link', { name: /^notification/i }))).toBe(false)
    expect(container.querySelector('a[href="/notifications"]')).not.toBeNull()
  })
})
