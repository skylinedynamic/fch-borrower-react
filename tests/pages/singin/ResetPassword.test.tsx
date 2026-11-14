import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import ResetPassword from '../../../src/pages/singin/ResetPassword'

beforeEach(() => {
  // Auth layout fetches branding theme on mount; not under test here.
  server.use(http.get('*/common/get-theme', () => HttpResponse.json({ status: false })))
})

describe('ResetPassword', () => {
  // Defect: BUG-199 - the checklist read "At lowercase letter (a-z)" and
  // "A least number (0-9)".
  it('lists the password rules in plain English', () => {
    renderWithProviders(<ResetPassword />, { route: '/reset-password?token=abc&email=jane@example.com' })

    const checklist = screen.getByText('Password must contain:').parentElement!
    const rules = Array.from(checklist.querySelectorAll('p')).map((p) => p.textContent)
    expect(rules).toEqual([
      'Minimum 8 characters',
      'At least one lowercase letter (a-z)',
      'At least one uppercase letter (A-Z)',
      'At least one number (0-9)',
    ])
  })
})
