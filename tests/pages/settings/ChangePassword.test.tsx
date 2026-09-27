import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import ChangePassword from '../../../src/pages/settings/ChangePassword'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

afterEach(() => {
  server.resetHandlers()
  navigateMock.mockClear()
})

describe('ChangePassword', () => {
  it('blocks submission client-side when the confirmation does not match, without calling the API', async () => {
    let called = false
    server.use(
      http.post('*/borrower/auth-profile/update-password', () => {
        called = true
        return HttpResponse.json({ status: true })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<ChangePassword />)

    await user.type(screen.getByLabelText(/Current Password/i), 'oldpass123')
    await user.type(screen.getByLabelText(/^New Password/i), 'NewPass123!')
    await user.type(screen.getByLabelText(/Confirm Password/i), 'Mismatch123!')
    await user.click(screen.getByRole('button', { name: /Update Password/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(called).toBe(false)
  })

  it('submits and navigates to /dashboard on success', async () => {
    let receivedBody: any = null
    server.use(
      http.post('*/borrower/auth-profile/update-password', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, message: 'Password updated' })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<ChangePassword />)

    await user.type(screen.getByLabelText(/Current Password/i), 'oldpass123')
    await user.type(screen.getByLabelText(/^New Password/i), 'NewPass123!')
    await user.type(screen.getByLabelText(/Confirm Password/i), 'NewPass123!')
    await user.click(screen.getByRole('button', { name: /Update Password/i }))

    await waitFor(() => expect(receivedBody).toEqual({
      current_password: 'oldpass123',
      new_password: 'NewPass123!',
      new_password_confirmation: 'NewPass123!',
    }))
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/dashboard'))
  })
})
