import { test, expect, pageHeading, dataRows } from '../../support/fixtures'
import { runSeeder } from '../../support/backend'
import { STRIPE_TEST_CARD, answer3dsChallenge, openPayNowWithCard } from '../../support/stripe'

// BUG-066: a card whose bank asks for 3-D Secure (OTP) can pay an invoice.
// Stripe's sandbox card 4000 0027 6000 3184 always asks; its test bank page
// offers Complete / Fail. The $1.00 unpaid invoice comes from a local-only
// seeder in the backend (idempotent - reused until it is paid).
//
// Serial: the failed attempt runs first and leaves the invoice Unpaid; the
// completed one then pays it.
test.describe.serial('Sidebar › Invoices (pay with a 3-D Secure card)', () => {
  test.beforeAll(() => {
    runSeeder('E2EUnpaidInvoiceSeeder')
  })

  let invoiceNo = ''

  async function openUnpaidInvoice(page: import('@playwright/test').Page) {
    await page.goto('/invoices')
    await expect(pageHeading(page, 'Invoices')).toBeVisible()
    const unpaid = dataRows(page).filter({ hasText: /Unpaid/ }).first()
    await expect(unpaid).toBeVisible()
    invoiceNo = (await unpaid.locator('td').nth(1).innerText()).trim()
    await unpaid.locator('td').first().click()
    await expect(page).toHaveURL(/\/invoices\/\d+$/)
  }

  test('a failed bank challenge leaves the invoice unpaid and records a Failed payment', async ({ page }) => {
    test.setTimeout(420_000)
    await openUnpaidInvoice(page)
    await openPayNowWithCard(page, STRIPE_TEST_CARD.REQUIRES_3DS)

    const handOff = page.waitForResponse((r) => r.request().method() === 'POST' && /\/borrower\/process-payment$/.test(r.url()), { timeout: 120_000 })
    const confirmed = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/borrower/process-payment/confirm'), { timeout: 180_000 })
    await page.getByRole('button', { name: /Pay \$\d/ }).click()

    const first = await handOff
    expect(first.status()).toBe(200)
    const body = await first.json()
    expect(body.data.requires_action).toBe(true)
    expect(String(body.data.client_secret)).toMatch(/^pi_.+_secret_/)

    await expect(page.getByRole('button', { name: /Waiting for your bank/i })).toBeVisible()
    await answer3dsChallenge(page, 'fail')

    const confirm = await confirmed
    expect(confirm.status()).toBe(400)
    await expect(page.locator('.Toastify__toast--error')).toBeVisible()

    await page.goto('/invoices')
    await expect(dataRows(page).filter({ hasText: invoiceNo })).toContainText(/Unpaid/)

    await page.goto('/payments')
    await expect(dataRows(page).filter({ hasText: /Failed/i }).first()).toBeVisible()
  })

  test('a completed bank challenge pays the invoice', async ({ page }) => {
    test.setTimeout(420_000)
    await openUnpaidInvoice(page)
    await openPayNowWithCard(page, STRIPE_TEST_CARD.REQUIRES_3DS)

    const confirmed = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/borrower/process-payment/confirm'), { timeout: 180_000 })
    await page.getByRole('button', { name: /Pay \$\d/ }).click()

    await answer3dsChallenge(page, 'complete')

    const confirm = await confirmed
    // Only the status: the page reloads after success, and the body is gone by
    // then. The invoice turning Paid below is what proves the payment settled.
    expect(confirm.status()).toBe(200)

    // The page reloads on its own after a successful payment; a goto racing
    // that reload is aborted (net::ERR_ABORTED), so retry until it lands.
    await expect(async () => {
      await page.goto('/invoices')
    }).toPass({ timeout: 30_000 })
    await expect(dataRows(page).filter({ hasText: invoiceNo })).toContainText(/Paid/)
  })
})
