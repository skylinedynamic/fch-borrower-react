import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

// Read-only: no payment method is added/changed (that goes through Stripe).
test.describe('Sidebar › Billing Details', () => {
  test('opens and finishes loading the billing summary', async ({ page }) => {
    await openFromSidebar(page, 'Billing Details', /\/billing-details$/)
    await expect(pageHeading(page, 'Billing Details')).toBeVisible()
    // Skeleton placeholders are replaced by the real cards.
    await expect(page.locator('.page-content .billing-card-amount').first()).toBeVisible()
  })
})
