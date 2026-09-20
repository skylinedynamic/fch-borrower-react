import { test, expect } from '@playwright/test'

// Runs against the local fch-backend-api dev server, same as login.spec.ts.
const TEST_EMAIL = 'craig-borrower@fourcornerfunding.com'
const TEST_PASSWORD = '12345678'

test.describe('Funding application wizard (live backend)', () => {
  test.beforeEach(async ({ request, page }) => {
    test.setTimeout(60000) // local Passport auth attempt is slow

    const health = await request
      .get('http://127.0.0.1:8000/api/v1/borrower/login')
      .catch(() => null)
    test.skip(!health, 'Local backend (http://127.0.0.1:8000) is not reachable')

    await page.goto('/login')
    await page.getByLabel(/^Email/i).fill(TEST_EMAIL)
    await page.getByLabel(/^Password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /Sign In/i }).click()
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 30000 })
  })

  test('loads the Business Information step behind the auth guard', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/fund-application')

    // Proves the full stack end-to-end: ProtectedRoute lets an authenticated
    // borrower through, the wizard fetches real business-info data from the
    // live backend, and the first step renders past its loading skeleton.
    await expect(page.getByText('Step 1 of 8: Business Information')).toBeVisible({ timeout: 20000 })
    // Two copies render (desktop + mobile responsive layouts share the step
    // component); either being populated confirms the real prefill worked.
    await expect(page.getByPlaceholder('Enter business name').first()).toHaveValue(/.+/, { timeout: 30000 })
  })
})
