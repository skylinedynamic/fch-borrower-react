import { afterEach, describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor, within } from '../../test-utils'
import { server } from '../../mocks/server'
import { mockOnboardingStep, signInBorrower, signOutBorrower } from '../../mocks/onboarding'
import CapitalAccessLocked from '../../../src/components/CapitalAccess/CapitalAccessLocked'

function renderLocked() {
  return renderWithProviders(
    <Routes>
      <Route path="/credit-card-stacking" element={<CapitalAccessLocked />} />
      <Route path="/credit-builder/guide" element={<p>Step-By-Step Guide page</p>} />
      <Route path="/profile" element={<p>Profile page</p>} />
    </Routes>,
    { route: '/credit-card-stacking' }
  )
}

afterEach(() => {
  server.resetHandlers()
  signOutBorrower()
})

describe('Credit Card Stacking while locked', () => {
  it('explains why it is still locked, and what is left', async () => {
    signInBorrower()
    mockOnboardingStep('verify_all')
    renderLocked()

    const why = await screen.findByRole('region', { name: /why is this still locked/i })
    const items = within(why).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[0]).toHaveTextContent(/complete your profile/i)
    await waitFor(() => expect(items[0]).toHaveTextContent(/done/i))
    expect(items[2]).toHaveTextContent(/tier 0/i)
    expect(items[2]).toHaveAttribute('aria-current', 'step')
  })

  it('takes the borrower to the next thing to do', async () => {
    const user = userEvent.setup()
    signInBorrower()
    mockOnboardingStep('verify_all')
    renderLocked()

    await user.click(await screen.findByRole('link', { name: /open step by step guide/i }))

    expect(await screen.findByText('Step-By-Step Guide page')).toBeInTheDocument()
  })

  it('says our team is verifying once the borrower has done their part', async () => {
    signInBorrower()
    mockOnboardingStep('upload_documents')
    renderLocked()

    const why = await screen.findByRole('region', { name: /why is this still locked/i })
    await waitFor(() => expect(why).toHaveTextContent(/our team is verifying your tier 0 tasks and credit profile/i))
    expect(within(why).queryByRole('link')).toBeNull()
  })

  it('shows how far along the borrower is', async () => {
    signInBorrower()
    mockOnboardingStep('verify_all')
    renderLocked()

    const progress = await screen.findByRole('progressbar', { name: /your progress/i })
    await waitFor(() => expect(progress).toHaveAttribute('aria-valuenow', '2'))
    expect(progress).toHaveAttribute('aria-valuemax', '4')
    expect(screen.getByText(/2 of 4 done/i)).toBeInTheDocument()
  })

  it('still shows the explanation when the status cannot be loaded', async () => {
    signInBorrower()
    server.use(http.get('*/borrower/profile/completion', () => HttpResponse.json({ message: 'Server error' }, { status: 500 })))
    renderLocked()

    expect(await screen.findByRole('region', { name: /why is this still locked/i })).toBeInTheDocument()
  })
})
