import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

// Read-only: no payment method is added/changed (that goes through Stripe).
test.describe('Sidebar › Billing Details', () => {
  test('opens and finishes loading the billing summary', async ({ page }) => {
    await openFromSidebar(page, 'Billing Details', /\/billing-details$/)
    await expect(pageHeading(page, 'Billing Details')).toBeVisible()
    // Skeleton placeholders are replaced by the real cards.
    await expect(page.locator('.page-content .billing-card-amount').first()).toBeVisible()
  })

  // BUG-101: in the built app Change did nothing - the dialog waited for a
  // `window.bootstrap` global the bundle never sets. Opened and closed only.
  test('Change opens the payment method dialog with the gateways', async ({ page }) => {
    await openFromSidebar(page, 'Billing Details', /\/billing-details$/)
    // The name starts with the icon font's glyph.
    await page.getByRole('button', { name: /^\W*Change$/ }).click()

    const dialog = page.locator('.modal.show').filter({ hasText: 'Change Default Payment Method' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Available Payment Gateways')).toBeVisible()

    await dialog.locator('.btn-close').click()
    await expect(dialog).toBeHidden()
  })

  // BUG-151 follow-up: a gateway that can't take payments (Stripe without keys)
  // is left out, and when none can the dialog says so instead of an empty grid.
  // Only the provider list is answered here; nothing is changed.
  test('Change says no payment method is available when none can take payments', async ({ page }) => {
    await page.route('**/common/partner-payment-providers', (route) =>
      route.fulfill({ json: { status: true, data: [{ id: 1, name: 'Stripe', display_name: 'Stripe', status: true, can_take_payments: false }] } })
    )
    await openFromSidebar(page, 'Billing Details', /\/billing-details$/)
    await page.getByRole('button', { name: /^\W*Change$/ }).click()

    const dialog = page.locator('.modal.show').filter({ hasText: 'Change Default Payment Method' })
    await expect(dialog.getByText(/No payment method is available right now/)).toBeVisible()
    await expect(dialog.getByText('Available Payment Gateways')).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: /save/i })).toHaveCount(0)
  })
})
