import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, waitFor, within } from '../../test-utils'
import { server } from '../../mocks/server'
import { signInBorrower, signOutBorrower } from '../../mocks/onboarding'
import Sidebar from '../../../src/components/Layout/Sidebar'

// The Sidebar's own badges are not what is under test.
vi.mock('../../../src/modules/dashboard', () => ({
  useActiveFundingRequests: () => ({ data: null, isLoading: false }),
}))
vi.mock('../../../src/modules/notifications', async (importActual) => ({
  ...(await importActual<typeof import('../../../src/modules/notifications')>()),
  useUnreadNotificationCount: () => ({ data: 0 }),
}))

const mockFundingAccess = (unlocked: boolean) => {
  const calls = { count: 0 }
  server.use(
    http.get('*/borrower/profile/completion', () => {
      calls.count++
      return HttpResponse.json({
        status: true,
        data: {
          is_complete: true,
          personal: { is_complete: true, missing_fields: [] },
          business: { is_complete: true, missing_fields: [] },
          financial: { is_complete: true, missing_fields: [] },
          funding: { unlocked, credit_profile_submitted: true },
        },
      })
    })
  )
  return calls
}

const fundingLink = () =>
  within(document.getElementById('navbar-nav') as HTMLElement).getByRole('link', { name: /^funding(?! request)/i })

afterEach(() => {
  signOutBorrower()
  server.resetHandlers()
})

/**
 * Funding waits for the credit report to be uploaded, but the menu does not
 * mark it: the item opens as usual, and the Funding page says what it waits
 * for (FundingGuard).
 */
describe('Sidebar: Funding before the credit report is uploaded', () => {
  it.each([
    ['locked', false],
    ['open', true],
  ])('shows Funding with no lock while it is %s, linking to the page', async (_, unlocked) => {
    signInBorrower({ name: 'Odessa' })
    const calls = mockFundingAccess(unlocked)
    renderWithProviders(<Sidebar />)

    await waitFor(() => expect(calls.count).toBeGreaterThan(0))
    await new Promise((r) => setTimeout(r, 50))
    expect(fundingLink()).toHaveAttribute('href', '/funding')
    expect(fundingLink().querySelector('.ri-lock-line')).toBeNull()
  })
})
