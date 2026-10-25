import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../test-utils'
import { mockOnboardingStep, signInBorrower, signOutBorrower } from '../../mocks/onboarding'
import { markStepShownThisSession } from '../../../src/modules/onboarding/storage'
import Header from '../../../src/components/Layout/Header'

/** The Getting Started "next step" button lives in the top bar, not floating over the page. */
beforeEach(() => {
  try {
    sessionStorage.clear()
  } catch {
    // not available
  }
})
afterEach(signOutBorrower)

describe('Header: Getting Started next step', () => {
  it('sits in the top bar, before the name and avatar', async () => {
    signInBorrower({ name: 'Odessa Mccall' })
    markStepShownThisSession(1, 'verify_all') // popup already seen this session
    mockOnboardingStep('verify_all')
    const { container } = renderWithProviders(<Header />)

    const nextStep = await screen.findByRole('button', { name: /next step/i })
    const topbar = container.querySelector('#page-topbar') as HTMLElement
    expect(topbar).toContainElement(nextStep)

    const userMenu = container.querySelector('#page-header-user-dropdown') as HTMLElement
    // Before it in the document, i.e. to its left.
    expect(nextStep.compareDocumentPosition(userMenu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows nothing there when there is no next step', async () => {
    signInBorrower({ name: 'Odessa Mccall' })
    const calls = mockOnboardingStep('completed')
    renderWithProviders(<Header />)

    await new Promise((r) => setTimeout(r, 50))
    expect(calls.count).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /next step/i })).toBeNull()
  })
})
