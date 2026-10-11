import { test, expect } from '@playwright/test'

// Smoke test proving the Playwright pipeline (webServer, build, browser) works
// end-to-end. Does not require a live backend, unlike later E2E specs
// (login submission, funding wizard, Stripe payment) which need a test API
// target — see Phase 6 of the test plan.
test('renders the login page for an unauthenticated visitor', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('form')).toBeVisible()
})
