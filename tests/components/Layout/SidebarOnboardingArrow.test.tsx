import { afterEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { act, renderWithProviders, screen, waitFor, within } from '../../test-utils'
import { mockOnboardingStep, signInBorrower, signOutBorrower } from '../../mocks/onboarding'
import Sidebar from '../../../src/components/Layout/Sidebar'

// The Sidebar's own badges are not what is under test.
vi.mock('../../../src/modules/dashboard', () => ({
  useActiveFundingRequests: () => ({ data: null, isLoading: false }),
}))
vi.mock('../../../src/modules/notifications', async (importActual) => ({
  ...(await importActual<typeof import('../../../src/modules/notifications')>()),
  useUnreadNotificationCount: () => ({ data: 0 }),
}))

/**
 * The walkthrough's arrow in the left menu: it points at the menu item the
 * borrower should open next, with a short tag saying why.
 */
const arrow = () => screen.queryByRole('img', { name: /go here next/i })
const menu = () => within(document.getElementById('navbar-nav') as HTMLElement)
const menuItem = (name: RegExp) => menu().getByRole('link', { name })
const creditBuilder = () => screen.getByRole('button', { name: /credit builder/i })

afterEach(signOutBorrower)

describe('Sidebar walkthrough arrow', () => {
  it('points at Profile while the credit profile is still to be submitted', async () => {
    signInBorrower({ name: 'Odessa' })
    mockOnboardingStep('credit_profile')
    renderWithProviders(<Sidebar />)

    await waitFor(() => expect(arrow()).not.toBeNull())
    expect(within(menuItem(/profile/i)).getByRole('img', { name: /go here next/i })).toHaveAccessibleName(
      /submit your credit profile/i
    )
  })

  it('points at Credit Builder, then at the Step-By-Step Guide once it is open, for Verify All', async () => {
    const user = userEvent.setup()
    signInBorrower({ name: 'Odessa' })
    mockOnboardingStep('verify_all')
    renderWithProviders(<Sidebar />)

    await waitFor(() => expect(arrow()).not.toBeNull())
    expect(within(creditBuilder()).getByRole('img', { name: /go here next/i })).toBeInTheDocument()

    await user.click(creditBuilder())

    expect(within(creditBuilder()).queryByRole('img', { name: /go here next/i })).toBeNull()
    expect(within(menuItem(/step-by-step guide/i)).getByRole('img', { name: /go here next/i })).toHaveAccessibleName(
      /verify all/i
    )
  })

  it('points at nothing while the borrower is choosing what they are looking for', async () => {
    // Results ready, no path chosen: pointing at one page would choose for them.
    signInBorrower({ name: 'Odessa' })
    const calls = mockOnboardingStep('results_ready')
    renderWithProviders(<Sidebar />)

    await waitFor(() => expect(calls.count).toBeGreaterThan(0))
    await act(() => new Promise((r) => setTimeout(r, 50)))
    expect(arrow()).toBeNull()
  })

  it.each([
    ['card_stacking', /credit card stacking/i],
    ['funding', /^funding(?! request)/i],
    ['advisor', /appointment/i],
  ] as const)('points at the page of the chosen path (%s)', async (path, item) => {
    signInBorrower({ name: 'Odessa' })
    mockOnboardingStep('results_ready', { selected_path: path } as never)
    renderWithProviders(<Sidebar />)

    await waitFor(() => expect(arrow()).not.toBeNull())
    expect(within(menuItem(item)).getByRole('img', { name: /go here next/i })).toBeInTheDocument()
  })

  it('points at Credit Builder, then at Credit Accounts once it is open, for a single card', async () => {
    const user = userEvent.setup()
    signInBorrower({ name: 'Odessa' })
    mockOnboardingStep('results_ready', { selected_path: 'single_card' } as never)
    renderWithProviders(<Sidebar />)

    await waitFor(() => expect(arrow()).not.toBeNull())
    expect(within(creditBuilder()).getByRole('img', { name: /go here next/i })).toBeInTheDocument()

    await user.click(creditBuilder())

    expect(within(creditBuilder()).queryByRole('img', { name: /go here next/i })).toBeNull()
    expect(within(menuItem(/credit accounts/i)).getByRole('img', { name: /go here next/i })).toHaveAccessibleName(
      /go to credit accounts/i
    )
  })

  it('points at Profile while the profile itself is incomplete', async () => {
    signInBorrower({ name: 'Odessa' })
    mockOnboardingStep('complete_profile')
    renderWithProviders(<Sidebar />)

    await waitFor(() => expect(arrow()).not.toBeNull())
    expect(within(menuItem(/profile/i)).getByRole('img', { name: /go here next/i })).toHaveAccessibleName(
      /complete your profile/i
    )
  })

  it.each([
    ['upload_documents', /documents/i],
  ] as const)('points at the right page for the %s step', async (step, item) => {
    signInBorrower({ name: 'Odessa' })
    mockOnboardingStep(step)
    renderWithProviders(<Sidebar />)

    await waitFor(() => expect(arrow()).not.toBeNull())
    expect(within(menuItem(item)).getByRole('img', { name: /go here next/i })).toBeInTheDocument()
  })

  it('goes away on the page it points to', async () => {
    signInBorrower({ name: 'Odessa' })
    const calls = mockOnboardingStep('results_ready')
    renderWithProviders(<Sidebar />, { route: '/credit-card-stacking' })

    await waitFor(() => expect(calls.count).toBeGreaterThan(0))
    await act(() => new Promise((r) => setTimeout(r, 50)))
    expect(arrow()).toBeNull()
  })

  it.each(['completed'] as const)('points nowhere on the %s step', async (step) => {
    signInBorrower({ name: 'Odessa' })
    const calls = mockOnboardingStep(step)
    renderWithProviders(<Sidebar />)

    await waitFor(() => expect(calls.count).toBeGreaterThan(0))
    await act(() => new Promise((r) => setTimeout(r, 50)))
    expect(arrow()).toBeNull()
  })
})
