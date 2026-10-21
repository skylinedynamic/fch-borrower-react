import { test, expect, pageHeading, dataRows } from '../../support/fixtures'
import { runSeeder } from '../../support/backend'

// Real card payment of an unpaid invoice through Stripe (partner sandbox, test
// card 4242 4242 4242 4242). The $1.00 unpaid invoice comes from a local-only
// seeder in fch-backend-api, since a borrower cannot create one.
test.describe('Sidebar › Invoices (pay with Stripe test card)', () => {
  test.beforeAll(() => {
    runSeeder('E2EUnpaidInvoiceSeeder')
  })

  test('pays an unpaid invoice and it turns Paid', async ({ page }) => {
    test.setTimeout(420_000)
    await page.goto('/invoices')
    await expect(pageHeading(page, 'Invoices')).toBeVisible()

    const unpaid = dataRows(page).filter({ hasText: /Unpaid/ }).first()
    await expect(unpaid).toBeVisible()
    const invoiceNo = (await unpaid.locator('td').nth(1).innerText()).trim()
    await unpaid.locator('td').first().click()
    await expect(page).toHaveURL(/\/invoices\/\d+$/)

    await page.getByRole('button', { name: /Pay Now/ }).click()
    const modal = page.locator('.modal.show').first()
    await expect(modal).toBeVisible()

    // Provider choice (skipped by the modal when Stripe is the only one).
    const stripeCard = modal.locator('.pps-card:not(.pps-card-skeleton)', { hasText: /Stripe/i })
    const cardIframe = modal.locator('iframe[name^="__privateStripeFrame"]').first()
    await expect(stripeCard.or(cardIframe).first()).toBeVisible({ timeout: 60_000 })
    if (await stripeCard.isVisible()) await stripeCard.click()
    await expect(cardIframe).toBeVisible({ timeout: 60_000 })

    const card = modal.frameLocator('iframe[name^="__privateStripeFrame"]').first()
    // Stripe's inputs only report "complete" for real keystrokes, so type them.
    await card.locator('input[name="cardnumber"]').pressSequentially('4242424242424242', { delay: 30 })
    await card.locator('input[name="exp-date"]').pressSequentially('1234', { delay: 30 })
    await card.locator('input[name="cvc"]').pressSequentially('123', { delay: 30 })
    const zip = card.locator('input[name="postal"]')
    if (await zip.count()) await zip.pressSequentially('10001', { delay: 30 })
    const payButton = page.getByRole('button', { name: /Pay \$\d/ })
    await expect(payButton).toBeEnabled({ timeout: 30_000 })

    const pay = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/borrower/process-payment'), { timeout: 120_000 })
    const sent = page.waitForRequest((r) => r.method() === 'POST' && r.url().includes('/borrower/process-payment'))
    await payButton.click()
    // E2E-017: only Stripe's token leaves the browser, never the card itself.
    const payload = (await sent).postDataJSON()
    expect(String(payload.payment_token)).toMatch(/^pm_/)
    expect(JSON.stringify(payload)).not.toContain('4242424242424242')
    const paid = await pay
    // Read the status first: the page moves on after success, and the body may be gone by then.
    expect(paid.status()).toBe(200)

    // The page navigates on its own after a successful payment; a goto racing
    // that navigation is aborted (net::ERR_ABORTED), so retry until it lands.
    await expect(async () => {
      await page.goto('/invoices')
    }).toPass({ timeout: 30_000 })
    const row = dataRows(page).filter({ hasText: invoiceNo })
    await expect(row).toContainText(/Paid/)
  })
})
