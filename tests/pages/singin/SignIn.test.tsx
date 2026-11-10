import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import { useAuthStore } from '../../../src/store/auth'
import SignIn from '../../../src/pages/singin/SignIn'

const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

beforeEach(() => {
  // Auth layout fetches branding theme on mount; not under test here.
  server.use(http.get('*/common/get-theme', () => HttpResponse.json({ status: false })))
})

afterEach(() => {
  server.resetHandlers()
  navigateMock.mockClear()
  useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })
})

describe('SignIn', () => {
  it('logs in and navigates home on success', async () => {
    server.use(
      http.post('*/borrower/login', () =>
        HttpResponse.json({ status: true, data: { token: 'tok_123', user: { id: 1, name: 'Jane' } } })
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<SignIn />)

    await user.type(screen.getByLabelText(/^Email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/^Password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/'))
    expect(useAuthStore.getState().token).toBe('tok_123')
  })

  it('shows field-level errors from a Laravel-style validation response', async () => {
    server.use(
      http.post('*/borrower/login', () =>
        HttpResponse.json(
          { status: false, message: 'The given data was invalid.', errors: { email: ['These credentials do not match our records.'] } },
          { status: 422 }
        )
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<SignIn />)

    await user.type(screen.getByLabelText(/^Email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/^Password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /Sign In/i }))

    expect(await screen.findByText('These credentials do not match our records.')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('replaces a subscription-expired error with a friendlier message', async () => {
    server.use(
      http.post('*/borrower/login', () =>
        HttpResponse.json(
          { status: false, message: 'Your subscription has expired.' },
          { status: 403 }
        )
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<SignIn />)

    await user.type(screen.getByLabelText(/^Email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/^Password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /Sign In/i }))

    expect(
      await screen.findByText('Your subscription has expired. Please contact your partner to renew your subscription.')
    ).toBeInTheDocument()
  })

  // BUG-198: on a white-label portal a wrong password reset the tab title to
  // the host's "Four Corner Funding" - the 401 was handled as a logout.
  it("a wrong password keeps the white-label portal's own tab title", async () => {
    server.use(
      http.get('*/common/branding', () =>
        HttpResponse.json({ success: true, data: { branding: { site_name: 'QA-Test WL Partner', is_white_label: true }, css_vars: null } })
      ),
      http.post('*/borrower/login', () =>
        HttpResponse.json({ status: false, message: 'Invalid email or password.', field: 'password' }, { status: 401 })
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<SignIn />)
    await waitFor(() => expect(document.title).toBe('QA-Test WL Partner | Borrower Portal'))

    await user.type(screen.getByLabelText(/^Email/i), 'qa.unknown@example.com')
    await user.type(screen.getByLabelText(/^Password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /Sign In/i }))

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
    // clearAuth() resets the title asynchronously; give it the chance to.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(document.title).toBe('QA-Test WL Partner | Borrower Portal')
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
