import { test, expect, pageHeading, dataRows } from '../../support/fixtures'
import { runSeeder } from '../../support/backend'

// Real API and session; only the list of payment methods is answered here.
// The API lists only the methods that can take a payment - a Stripe switched on
// without usable keys is left out - so when none can, the payment modal says
// online payment isn't available instead of waiting on a card form forever.
// Nothing is paid or written; the unpaid invoice comes from the same local-only
// seeder the Stripe payment spec uses.
test.describe('Sidebar › Invoices (no payment method can take a payment)', () => {
  test.beforeAll(() => {
    runSeeder('E2EUnpaidInvoiceSeeder')
  })

  test('the payment modal says online payment is not available', async ({ page }) => {
    await page.route('**/payment/get-payment-methods', (route) =>
      route.fulfill({ json: { status: true, message: 'Payment Methods retrieved successfully.', data: [] } })
    )

    await page.goto('/invoices')
    await expect(pageHeading(page, 'Invoices')).toBeVisible()
    const unpaid = dataRows(page).filter({ hasText: /Unpaid/ }).first()
    await expect(unpaid).toBeVisible()
    await unpaid.locator('td').first().click()
    await expect(page).toHaveURL(/\/invoices\/\d+$/)

    await page.getByRole('button', { name: /Pay Now/ }).click()
    const modal = page.locator('.modal.show').first()

    await expect(modal.getByText("Online payment isn't available for this invoice right now. Please contact support to arrange payment.")).toBeVisible()
    await expect(modal.getByText('Initializing secure payment gateway...')).toHaveCount(0)
  })
})
