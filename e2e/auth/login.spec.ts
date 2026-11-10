import { test, expect } from '@playwright/test'
import { API_BASE_URL, BORROWER_EMAIL, BORROWER_PASSWORD, SLOW_TIMEOUT } from '../support/env'

// Guest flows: runs without a saved session (the `guest` project).
test.describe('Login (live backend)', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ request }) => {
    const health = await request
      .post(`${API_BASE_URL}/borrower/login`, { data: {}, headers: { Accept: 'application/json' }, timeout: SLOW_TIMEOUT })
      .catch(() => null)
    test.skip(!health, `Local backend (${API_BASE_URL}) is not reachable`)
  })

  test('renders the login form for an unauthenticated visitor', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/^Email/i)).toBeVisible()
    await expect(page.getByLabel(/^Password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeEnabled()
  })

  test('redirects a protected route to /login when signed out', async ({ page }) => {
    await page.goto('/invoices')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('shows an error for an email that does not exist', async ({ page }) => {
    // A non-existent address, so the real account's lockout counter is never touched.
    await page.goto('/login')
    await page.getByLabel(/^Email/i).fill('e2e-no-such-user@example.invalid')
    await page.getByLabel(/^Password/i).fill('wrong-password')
    await page.getByRole('button', { name: /Sign In/i }).click()

    // The same answer as a wrong password, so it does not reveal which emails have an account (BUG-104).
    await expect(page.getByText('Invalid email or password.')).toBeVisible({ timeout: SLOW_TIMEOUT })
    await expect(page).toHaveURL(/\/login$/)
  })

  // BUG-198: a failed sign-in was handled as a logout, which set the tab title
  // to the host's bare "Four Corner Funding" until a reload.
  test('a failed sign-in keeps the portal tab title', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle('Four Corner Funding | Borrower Portal')

    await page.getByLabel(/^Email/i).fill('e2e-no-such-user@example.invalid')
    await page.getByLabel(/^Password/i).fill('wrong-password')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await expect(page.getByText('Invalid email or password.')).toBeVisible({ timeout: SLOW_TIMEOUT })

    // clearAuth() used to reset it asynchronously, just after the error showed.
    await page.waitForTimeout(500)
    await expect(page).toHaveTitle('Four Corner Funding | Borrower Portal')
  })

  // Same on a white-label portal. Locally every domain is the host's, so only
  // the branding answer is the partner's; the sign-in is the real backend's.
  test("a failed sign-in keeps a white-label portal's own tab title", async ({ page }) => {
    await page.route('**/common/branding', (route) =>
      route.fulfill({ json: { success: true, data: { branding: { site_name: 'QA-Test WL Partner', is_white_label: true }, css_vars: null } } })
    )
    await page.goto('/login')
    await expect(page).toHaveTitle('QA-Test WL Partner | Borrower Portal')

    await page.getByLabel(/^Email/i).fill('e2e-no-such-user@example.invalid')
    await page.getByLabel(/^Password/i).fill('wrong-password')
    await page.getByRole('button', { name: /Sign In/i }).click()
    await expect(page.getByText('Invalid email or password.')).toBeVisible({ timeout: SLOW_TIMEOUT })

    await page.waitForTimeout(500)
    await expect(page).toHaveTitle('QA-Test WL Partner | Borrower Portal')
  })

  test('logs in with valid credentials and lands on the dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/^Email/i).fill(BORROWER_EMAIL)
    await page.getByLabel(/^Password/i).fill(BORROWER_PASSWORD)
    await page.getByRole('button', { name: /Sign In/i }).click()

    await expect(page).not.toHaveURL(/\/login$/, { timeout: SLOW_TIMEOUT })
    await expect(page.locator('#navbar-nav')).toBeVisible()
  })
})
