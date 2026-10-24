import { test, expect, type Page, type Route } from '@playwright/test'

// The links in the email-change emails open on the borrower portal (not on the
// API): /email-change/{confirm|cancel|undo}/{user}/{hash}?expires&signature.
// The page reads the link from the API's JSON endpoint at the same path,
// passing the query along, and acts on it only when the user says so - signed
// in or not. fch-api's EmailChangePortalLinksTest covers the API side.
const API_ORIGIN = 'http://127.0.0.1:8000/api/v1'
const QUERY = '?expires=1792567483&signature=2c7f05a77a7c7d888b293e9d88d751573327d1f4f612a71fe9ca1682e5a41d36'
const CONFIRM = '/email-change/confirm/251/49803257525d343a66c3dbb23f69dbb913db9712'

type Call = { method: string; path: string; body: unknown }

const link = (overrides: Record<string, unknown> = {}) => ({
  status: true,
  message: 'ok',
  data: {
    action: 'confirm', state: 'ready', title: 'Confirm your new email address',
    message: 'Enter your password to start signing in with new@example.test.', tone: 'info',
    button: 'Confirm email change', needs_password: true, login_url: null, ...overrides,
  },
})

/** Answers the API: the email-change endpoint per method, anything else with an empty success. */
async function mockApi(page: Page, path: string, answers: { GET?: unknown; POST?: unknown }): Promise<Call[]> {
  const calls: Call[] = []
  await page.route(`${API_ORIGIN}/**`, (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const apiPath = url.pathname.replace(/^\/api\/v1/, '') + url.search
    if (url.pathname.endsWith(path)) {
      calls.push({ method: req.method(), path: apiPath, body: req.postDataJSON?.() ?? null })
      const body = answers[req.method() as 'GET' | 'POST']
      if (body) return route.fulfill({ json: body })
    }
    return route.fulfill({ json: { status: true, success: true, message: 'ok', data: [] } })
  })
  return calls
}

const password = (page: Page) => page.getByLabel('Password', { exact: true })

test.describe('Borrower portal › email change link', () => {
  test('the confirmation link asks for the password and confirms the change', async ({ page }) => {
    const calls = await mockApi(page, CONFIRM, {
      GET: link(),
      POST: link({ state: 'changed', title: 'Email address changed', message: 'You now sign in with new@example.test.', tone: 'success', button: null, needs_password: false, login_url: 'http://localhost:4173/login' }),
    })
    await page.goto(CONFIRM + QUERY)

    await expect(page.getByRole('heading', { name: 'Confirm your new email address' })).toBeVisible()
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0)
    expect(calls[0].path).toBe(CONFIRM + QUERY)

    await password(page).fill('secret-password')
    await page.getByRole('button', { name: 'Confirm email change' }).click()

    await expect(page.getByRole('heading', { name: 'Email address changed' })).toBeVisible()
    const post = calls.find((c) => c.method === 'POST')!
    expect(post.body).toEqual({ password: 'secret-password' })
    expect(post.path).toBe(CONFIRM + QUERY)
    await expect(page.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute('href', 'http://localhost:4173/login')
  })

  test('a wrong password is shown under the field and the form stays', async ({ page }) => {
    await mockApi(page, CONFIRM, {
      GET: link(),
      POST: link({ state: 'wrong_password', message: 'That password is not correct.', tone: 'danger' }),
    })
    await page.goto(CONFIRM + QUERY)

    await password(page).fill('a-guess')
    await page.getByRole('button', { name: 'Confirm email change' }).click()

    await expect(page.getByText('That password is not correct.')).toBeVisible()
    await expect(password(page)).toHaveClass(/is-invalid/)
  })

  test('an expired link explains itself and offers sign-in', async ({ page }) => {
    await mockApi(page, CONFIRM, {
      GET: link({ state: 'invalid', title: 'This link has expired', message: 'Ask for the email change again.', tone: 'warning', button: null, needs_password: false }),
    })
    await page.goto(CONFIRM + QUERY)

    await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeVisible()
    await expect(password(page)).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute('href', '/login')
  })

  test('the old address undoes a confirmed change without a password', async ({ page }) => {
    const UNDO = '/email-change/undo/251/49803257525d343a66c3dbb23f69dbb913db9712'
    const calls = await mockApi(page, UNDO, {
      GET: link({ action: 'undo', title: 'Undo this email change?', button: 'Undo the change', needs_password: false }),
      POST: link({ action: 'undo', state: 'reverted', title: 'Email change undone', tone: 'success', button: null, needs_password: false }),
    })
    await page.goto(UNDO + QUERY)

    await expect(password(page)).toHaveCount(0)
    await page.getByRole('button', { name: 'Undo the change' }).click()

    await expect(page.getByRole('heading', { name: 'Email change undone' })).toBeVisible()
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1)
  })
})
