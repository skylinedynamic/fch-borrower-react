import { test as setup, expect } from '@playwright/test'
import { API_BASE_URL, AUTH_STATE_PATH, BORROWER_EMAIL, BORROWER_PASSWORD, SLOW_TIMEOUT } from './support/env'

// Logs in once through the real login form and saves the persisted auth store
// (localStorage) so every sidebar spec starts already authenticated, instead
// of paying for a Passport login per test.
setup('authenticate as borrower', async ({ page, request }) => {
  setup.setTimeout(90_000)

  const health = await request
    .post(`${API_BASE_URL}/borrower/login`, { data: {}, headers: { Accept: 'application/json' }, timeout: SLOW_TIMEOUT })
    .catch(() => null)
  setup.skip(!health, `Local backend (${API_BASE_URL}) is not reachable`)

  await page.goto('/login')
  await page.getByLabel(/^Email/i).fill(BORROWER_EMAIL)
  await page.getByLabel(/^Password/i).fill(BORROWER_PASSWORD)
  await page.getByRole('button', { name: /Sign In/i }).click()

  await expect(page).not.toHaveURL(/\/login$/, { timeout: SLOW_TIMEOUT })
  await expect(page.locator('#navbar-nav')).toBeVisible({ timeout: SLOW_TIMEOUT })

  await page.context().storageState({ path: AUTH_STATE_PATH })
})
