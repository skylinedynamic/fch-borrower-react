import { test, expect } from '../../support/fixtures'
import { API_BASE_URL, BORROWER_EMAIL, BORROWER_PASSWORD, SLOW_TIMEOUT } from '../../support/env'
import { runSeeder } from '../../support/backend'

// Real password change through the form, verified against the login API, then
// put back by a local-only seeder (the original password predates the current
// strength rules, so the form itself can't restore it). Changing the password
// does not revoke tokens, so the shared session keeps working.
const TEMP_PASSWORD = 'E2e!Temp9xQ'

test.describe('Topbar › Change Password (submit)', () => {
  test.afterEach(() => {
    runSeeder('E2EResetBorrowerPasswordSeeder')
  })

  test('a wrong current password is rejected by the server', async ({ page }) => {
    await page.goto('/change-password')
    await page.getByPlaceholder('Enter your current password').fill('not-my-password')
    await page.getByPlaceholder('Enter new password').fill(TEMP_PASSWORD)
    await page.getByPlaceholder('Confirm new password').fill(TEMP_PASSWORD)
    const res = page.waitForResponse((r) => r.url().includes('/update-password'))
    await page.locator('.page-content form button[type="submit"]').click()

    expect((await res).status()).toBe(422)
    await expect(page.locator('.page-content .invalid-feedback').first()).toBeVisible()
    await expect(page).toHaveURL(/\/change-password$/)
  })

  test('changes the password; the new one logs in', async ({ page, request }) => {
    await page.goto('/change-password')
    await page.getByPlaceholder('Enter your current password').fill(BORROWER_PASSWORD)
    await page.getByPlaceholder('Enter new password').fill(TEMP_PASSWORD)
    await page.getByPlaceholder('Confirm new password').fill(TEMP_PASSWORD)
    const res = page.waitForResponse((r) => r.url().includes('/update-password'))
    await page.locator('.page-content form button[type="submit"]').click()

    expect((await res).status()).toBe(200)
    await expect(page.getByText('Password updated successfully!')).toBeVisible()
    await expect(page).toHaveURL(/\/dashboard$/)

    const login = await request.post(`${API_BASE_URL}/borrower/login`, {
      data: { email: BORROWER_EMAIL, password: TEMP_PASSWORD },
      headers: { Accept: 'application/json' },
      timeout: SLOW_TIMEOUT,
    })
    expect((await login.json()).status).toBe(true)
  })
})
