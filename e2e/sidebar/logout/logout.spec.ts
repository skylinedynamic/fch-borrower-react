import { test as base, expect } from '@playwright/test'
import { API_BASE_URL, BORROWER_EMAIL, BORROWER_PASSWORD, SLOW_TIMEOUT } from '../../support/env'

// Logs in on its own instead of using the shared session: logging out revokes
// the token server-side, which would sign every later spec out too.
const test = base.extend({ storageState: { cookies: [], origins: [] } })

test.describe('Sidebar › Logout', () => {
  test('signs out, clears the session and blocks protected routes', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/^Email/i).fill(BORROWER_EMAIL)
    await page.getByLabel(/^Password/i).fill(BORROWER_PASSWORD)
    await page.getByRole('button', { name: /Sign In/i }).click()
    await expect(page.locator('#navbar-nav')).toBeVisible({ timeout: SLOW_TIMEOUT })

    const logout = page.waitForResponse((r) => r.url().startsWith(API_BASE_URL) && /logout/.test(r.url()))
    await page.locator('#navbar-nav').getByRole('link', { name: 'Logout' }).click()
    await logout
    await expect(page).toHaveURL(/\/login$/)

    const token = await page.evaluate(() => JSON.parse(localStorage.getItem('auth') || '{}')?.state?.token ?? null)
    expect(token).toBeNull()

    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login$/)
  })
})
