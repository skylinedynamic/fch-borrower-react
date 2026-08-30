import { test, expect } from '@playwright/test'

// Runs against the local fch-backend-api dev server (http://127.0.0.1:8000,
// matching .env's VITE_API_BASE_URL) using a seeded borrower account from
// database/seeders/BorrowerSeeder.php. Requires that backend running with
// its local DB migrated/seeded — skips itself otherwise rather than failing
// the whole suite when no backend is available.
const TEST_EMAIL = 'craig-borrower@fourcornerfunding.com'
const TEST_PASSWORD = '12345678'

test.describe('Login (live backend)', () => {
  // The local PHP dev server isn't built for concurrency; run these
  // sequentially rather than in parallel workers to avoid one request
  // starving the other and producing flaky timeouts.
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ request }) => {
    const health = await request
      .get('http://127.0.0.1:8000/api/v1/borrower/login')
      .catch(() => null)
    test.skip(!health, 'Local backend (http://127.0.0.1:8000) is not reachable')
  })

  test('logs in with valid credentials and reaches the dashboard', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/^Email/i).fill(TEST_EMAIL)
    await page.getByLabel(/^Password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /Sign In/i }).click()

    // Login (Passport token issuance) on a local dev backend can take well
    // over the default timeout.
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 20000 })
    await expect(page.locator('body')).not.toContainText('Invalid credentials')
  })

  test('shows an error and stays on the login page with wrong credentials', async ({ page }) => {
    test.slow() // local Passport auth attempt is slow; extend this test's timeout

    await page.goto('/login')

    await page.getByLabel(/^Email/i).fill(TEST_EMAIL)
    await page.getByLabel(/^Password/i).fill('wrong-password')
    await page.getByRole('button', { name: /Sign In/i }).click()

    await expect(page.locator('.invalid-feedback, .alert-danger').first()).toBeVisible({ timeout: 20000 })
    await expect(page).toHaveURL(/\/login$/)
  })
})
