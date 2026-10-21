import { test as base, expect } from '@playwright/test'
import { API_BASE_URL, BORROWER_EMAIL, BORROWER_PASSWORD, SLOW_TIMEOUT } from '../../support/env'

// Own session: logging out revokes the token, which would sign out the shared one.
const test = base.extend({ storageState: { cookies: [], origins: [] } })

test('Topbar › Logout signs out and blocks protected routes', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/^Email/i).fill(BORROWER_EMAIL)
  await page.getByLabel(/^Password/i).fill(BORROWER_PASSWORD)
  await page.getByRole('button', { name: /Sign In/i }).click()
  await expect(page.locator('#navbar-nav')).toBeVisible({ timeout: SLOW_TIMEOUT })

  await page.locator('header #page-header-user-dropdown').click()
  const logout = page.waitForResponse((r) => r.url().startsWith(API_BASE_URL) && /logout/.test(r.url()))
  await page.locator('header .topbar-user .dropdown-menu').getByText('Logout').click()
  await logout
  await expect(page).toHaveURL(/\/login$/)

  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})
