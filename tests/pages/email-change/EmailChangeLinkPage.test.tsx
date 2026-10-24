import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { server } from '../../mocks/server'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import EmailChangeLinkPage from '../../../src/pages/email-change/EmailChangeLinkPage'

/**
 * Where an email-change link lands on the borrower portal: the page reads the
 * link from the API, shows what it is about, and confirms (with the password),
 * cancels or undoes the change on the user's say-so. Nobody needs to be signed in.
 */
const QUERY = '?expires=1792567483&signature=2c7f'
const CONFIRM_PATH = '/email-change/confirm/251/abc123'

type Seen = { calls: number; bodies: unknown[]; urls: string[] }

function answer(method: 'get' | 'post', path: string, data: Record<string, unknown>): Seen {
  const seen: Seen = { calls: 0, bodies: [], urls: [] }
  server.use(
    http[method](`*${path}`, async ({ request }) => {
      seen.calls += 1
      seen.urls.push(request.url)
      if (method === 'post') seen.bodies.push(await request.json().catch(() => null))
      return HttpResponse.json({ status: true, message: 'ok', data })
    })
  )
  return seen
}

const link = (overrides: Record<string, unknown> = {}) => ({
  action: 'confirm',
  state: 'ready',
  title: 'Confirm your new email',
  message: 'Enter your password to start signing in with new@example.test.',
  tone: 'info',
  button: 'Confirm new email',
  needs_password: true,
  login_url: null,
  ...overrides,
})

const renderAt = (route: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/email-change/:action/:user/:hash" element={<EmailChangeLinkPage />} />
    </Routes>,
    { route }
  )

describe('Email change link page (borrower portal)', () => {
  // The sign-in layout paints the partner's branding.
  beforeEach(() => server.use(http.get('*/common/branding', () => HttpResponse.json({ success: true, data: { branding: {} } }))))
  afterEach(() => server.resetHandlers())

  it('shows what the link is about and asks for the password, changing nothing yet', async () => {
    answer('get', CONFIRM_PATH, link())
    const submit = answer('post', CONFIRM_PATH, link({ state: 'changed' }))

    renderAt(CONFIRM_PATH + QUERY)

    expect(await screen.findByRole('heading', { name: 'Confirm your new email' })).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm new email' })).toBeInTheDocument()
    expect(submit.calls).toBe(0)
  })

  it('confirms with the password and then offers sign-in', async () => {
    answer('get', CONFIRM_PATH, link())
    const submit = answer('post', CONFIRM_PATH, link({
      state: 'changed', title: 'Email changed', message: 'You now sign in with new@example.test.', tone: 'success',
      button: null, needs_password: false, login_url: 'https://client.wl.com/login',
    }))
    const user = userEvent.setup()
    renderAt(CONFIRM_PATH + QUERY)

    await user.type(await screen.findByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Confirm new email' }))

    expect(await screen.findByRole('heading', { name: 'Email changed' })).toBeInTheDocument()
    expect(submit.bodies[0]).toEqual({ password: 'secret' })
    expect(new URL(submit.urls[0]).search).toBe(QUERY)
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', 'https://client.wl.com/login')
  })

  it('shows a wrong password under the field and keeps the form', async () => {
    answer('get', CONFIRM_PATH, link())
    answer('post', CONFIRM_PATH, link({ state: 'wrong_password', message: 'That password is not right.', tone: 'danger' }))
    const user = userEvent.setup()
    renderAt(CONFIRM_PATH + QUERY)

    await user.type(await screen.findByLabelText('Password'), 'guess')
    await user.click(screen.getByRole('button', { name: 'Confirm new email' }))

    expect(await screen.findByText('That password is not right.')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveClass('is-invalid')
  })

  it('needs a password before confirming', async () => {
    answer('get', CONFIRM_PATH, link())
    const submit = answer('post', CONFIRM_PATH, link({ state: 'changed' }))
    const user = userEvent.setup()
    renderAt(CONFIRM_PATH + QUERY)

    await user.click(await screen.findByRole('button', { name: 'Confirm new email' }))

    expect(await screen.findByText('Enter your password.')).toBeInTheDocument()
    expect(submit.calls).toBe(0)
  })

  it('explains an invalid or expired link, with a way back to sign-in', async () => {
    answer('get', CONFIRM_PATH, link({ state: 'invalid', title: 'This link no longer works', message: 'It has expired.', tone: 'warning', button: null, needs_password: false }))
    renderAt(CONFIRM_PATH + QUERY)

    expect(await screen.findByRole('heading', { name: 'This link no longer works' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })

  it('undoes a confirmed change without a password', async () => {
    const UNDO = '/email-change/undo/251/abc123'
    answer('get', UNDO, link({ action: 'undo', title: 'Undo this change?', button: 'Undo the change', needs_password: false }))
    const submit = answer('post', UNDO, link({ action: 'undo', state: 'reverted', title: 'Email change undone', tone: 'success', button: null, needs_password: false }))
    const user = userEvent.setup()
    renderAt(UNDO + QUERY)

    await user.click(await screen.findByRole('button', { name: 'Undo the change' }))

    expect(await screen.findByRole('heading', { name: 'Email change undone' })).toBeInTheDocument()
    expect(submit.bodies[0]).toEqual({})
  })

  it('treats an unknown action as an invalid link without asking the API', async () => {
    const read = answer('get', '/email-change/delete/251/abc123', link())
    renderAt('/email-change/delete/251/abc123' + QUERY)

    expect(await screen.findByRole('heading', { name: /link is not valid/i })).toBeInTheDocument()
    await waitFor(() => expect(read.calls).toBe(0))
  })
})
