import { afterEach, describe, expect, it, vi } from 'vitest'
import { Link, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import Profile from '../../../src/pages/profile/profile'
import { useAuthStore } from '../../../src/store/auth'

// The tabs' own behaviour is covered in ./components; here only which one shows.
// Each stands in for a successful save, which the real tab reports through onSave.
const { tabStub } = vi.hoisted(() => ({
  tabStub: (name: string) => ({
    default: ({ onSave }: { onSave?: () => void }) => (
      <div>
        {name} tab
        <button type="button" onClick={() => onSave?.()}>
          Simulate {name} saved
        </button>
      </div>
    ),
  }),
}))
vi.mock('../../../src/pages/profile/components/PersonalInfo', () => tabStub('Personal'))
vi.mock('../../../src/pages/profile/components/BusinessDetails', () => tabStub('Business'))
vi.mock('../../../src/pages/profile/components/FinancialSupport', () => tabStub('Financial'))
vi.mock('../../../src/pages/profile/components/CreditProfileTab', () => ({
  // Stands in for a successful submit, which the real tab reports through onSubmitted.
  default: ({ onSubmitted }: { onSubmitted?: () => void }) => (
    <div>
      Credit tab
      <button type="button" onClick={() => onSubmitted?.()}>
        Simulate credit profile submitted
      </button>
    </div>
  ),
}))

describe('Profile page', () => {
  it('opens on the tab named in the URL', () => {
    renderWithProviders(<Profile />, { route: '/profile?tab=3' })
    expect(screen.getByText('Credit tab')).toBeInTheDocument()
  })

  it('follows a link to another tab while already on the page', async () => {
    // The Getting Started "what's next" modal links to /profile?tab=3 straight
    // after the borrower finishes the Financial tab - same page, new query.
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <Link to="/profile?tab=3">Fill Credit Profile</Link>
        <Profile />
      </>,
      { route: '/profile?tab=2' }
    )
    expect(screen.getByText('Financial tab')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /fill credit profile/i }))

    expect(await screen.findByText('Credit tab')).toBeInTheDocument()
  })

  describe('after saving a section', () => {
    // On to the next section still to complete: Business, Financial, then the credit profile.
    const serveCompletion = (done: { personal?: boolean; business?: boolean; financial?: boolean }, currentStep: string | null) =>
      server.use(
        http.get('*/borrower/profile/completion', () =>
          HttpResponse.json({
            status: true,
            data: {
              is_complete: !!(done.personal && done.business && done.financial),
              personal: { is_complete: !!done.personal, missing_fields: [] },
              business: { is_complete: !!done.business, missing_fields: [] },
              financial: { is_complete: !!done.financial, missing_fields: [] },
              onboarding: { flow: 'paid', current_step: currentStep, completed_steps: 0, total_steps: 5, results_ready: false, pending_steps: [] },
            },
          })
        )
      )

    afterEach(() => server.resetHandlers())

    it('takes the borrower from Personal Info to Business Details when that is not complete', async () => {
      const user = userEvent.setup()
      serveCompletion({ personal: true }, 'complete_profile')
      renderWithProviders(<Profile />, { route: '/profile?tab=0' })

      await user.click(screen.getByRole('button', { name: /simulate personal saved/i }))

      expect(await screen.findByText('Business tab')).toBeInTheDocument()
    })

    it('takes the borrower from Business Details to Financial when that is not complete', async () => {
      const user = userEvent.setup()
      serveCompletion({ personal: true, business: true }, 'complete_profile')
      renderWithProviders(<Profile />, { route: '/profile?tab=1' })

      await user.click(screen.getByRole('button', { name: /simulate business saved/i }))

      expect(await screen.findByText('Financial tab')).toBeInTheDocument()
    })

    it('takes the borrower from Financial to the credit profile when it is not submitted', async () => {
      const user = userEvent.setup()
      serveCompletion({ personal: true, business: true, financial: true }, 'credit_profile')
      renderWithProviders(<Profile />, { route: '/profile?tab=2' })

      await user.click(screen.getByRole('button', { name: /simulate financial saved/i }))

      expect(await screen.findByText('Credit tab')).toBeInTheDocument()
    })

    it('skips sections already complete', async () => {
      const user = userEvent.setup()
      serveCompletion({ personal: true, business: true, financial: true }, 'credit_profile')
      renderWithProviders(<Profile />, { route: '/profile?tab=0' })

      await user.click(screen.getByRole('button', { name: /simulate personal saved/i }))

      expect(await screen.findByText('Credit tab')).toBeInTheDocument()
    })

    it('stays on the section while it is still incomplete', async () => {
      const user = userEvent.setup()
      const calls = { count: 0 }
      serveCompletion({ personal: false }, 'complete_profile')
      server.use(
        http.get('*/borrower/profile/completion', () => {
          calls.count++
          return undefined as never
        })
      )
      renderWithProviders(<Profile />, { route: '/profile?tab=0' })

      await user.click(screen.getByRole('button', { name: /simulate personal saved/i }))

      await waitFor(() => expect(calls.count).toBeGreaterThan(0))
      await new Promise((r) => setTimeout(r, 50))
      expect(screen.getByText('Personal tab')).toBeInTheDocument()
    })

    it('stays on the section once everything is complete', async () => {
      const user = userEvent.setup()
      serveCompletion({ personal: true, business: true, financial: true }, 'verify_all')
      renderWithProviders(<Profile />, { route: '/profile?tab=1' })

      await user.click(screen.getByRole('button', { name: /simulate business saved/i }))

      await new Promise((r) => setTimeout(r, 100))
      expect(screen.getByText('Business tab')).toBeInTheDocument()
    })
  })

  describe('after the credit profile is submitted', () => {
    const renderWithDestinations = () =>
      renderWithProviders(
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/credit-builder/guide" element={<div>Step-By-Step Guide page</div>} />
          <Route path="/funding" element={<div>Funding page</div>} />
          <Route path="/documents" element={<div>Documents page</div>} />
        </Routes>,
        { route: '/profile?tab=3' }
      )
    const signIn = (user: Record<string, unknown>) =>
      useAuthStore.setState({ token: 't', user: { id: 1, ...user }, userSubscription: null } as never)

    afterEach(() => useAuthStore.setState({ token: undefined, user: null, userSubscription: null } as never))

    it('lands a paid borrower on the Step-By-Step Guide to complete Tier 0', async () => {
      const user = userEvent.setup()
      signIn({ is_free_trail: false })
      renderWithDestinations()

      await user.click(screen.getByRole('button', { name: /simulate credit profile submitted/i }))

      expect(await screen.findByText('Step-By-Step Guide page')).toBeInTheDocument()
    })

    it('lands a limited-access (free-trial) borrower on Funding: their walkthrough ends here', async () => {
      // The Step-By-Step Guide is closed to them.
      const user = userEvent.setup()
      signIn({ is_free_trail: true })
      renderWithDestinations()

      await user.click(screen.getByRole('button', { name: /simulate credit profile submitted/i }))

      expect(await screen.findByText('Funding page')).toBeInTheDocument()
    })
  })

  describe('scrolling', () => {
    // A modal torn down mid-way (e.g. the Complete Your Profile popup) can
    // leave the page locked: `modal-open` and overflow hidden on <body>, with
    // nothing on screen. Moving between tabs must give the scroll back.
    const lockBody = () => {
      document.body.classList.add('modal-open')
      document.body.style.overflow = 'hidden'
      const backdrop = document.createElement('div')
      backdrop.className = 'modal-backdrop'
      document.body.appendChild(backdrop)
    }

    it('gives the scroll back when moving to another tab', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Profile />, { route: '/profile?tab=0' })
      lockBody()

      await user.click(screen.getByRole('button', { name: /business details/i }))

      expect(await screen.findByText('Business tab')).toBeInTheDocument()
      expect(document.body).not.toHaveClass('modal-open')
      expect(document.body.style.overflow).toBe('')
      expect(document.querySelector('.modal-backdrop')).toBeNull()
    })

    it('also catches a lock left behind just after arriving', async () => {
      // The popup that brought the borrower here is still fading out when the
      // page mounts; whatever it leaves behind is cleared once that is over.
      renderWithProviders(<Profile />, { route: '/profile?tab=1' })
      expect(screen.getByText('Business tab')).toBeInTheDocument()
      lockBody()

      await waitFor(() => expect(document.body).not.toHaveClass('modal-open'), { timeout: 2000 })
      expect(document.body.style.overflow).toBe('')
      expect(document.querySelector('.modal-backdrop')).toBeNull()
    })

    it('leaves a modal that really is open alone', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Profile />, { route: '/profile?tab=0' })
      lockBody()
      const modal = document.createElement('div')
      modal.className = 'modal show'
      document.body.appendChild(modal)

      await user.click(screen.getByRole('button', { name: /business details/i }))

      expect(document.body).toHaveClass('modal-open')
      modal.remove()
      document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove())
      document.body.classList.remove('modal-open')
      document.body.style.overflow = ''
    })
  })
})
