import type { Page } from '@playwright/test'
import { test, expect, pageHeading, dataRows } from '../../support/fixtures'
import { API_BASE_URL } from '../../support/env'
import { runSeeder } from '../../support/backend'

// E2E-017: card data never leaves the browser except as a gateway token, the
// API refuses a raw card payload, and the manual methods (paid outside the
// portal, confirmed with a reference number) keep working.
// Each test gets a fresh $1 unpaid invoice from the local-only seeder.

async function openUnpaidInvoice(page: Page) {
  await page.goto('/invoices')
  await expect(pageHeading(page, 'Invoices')).toBeVisible()
  const unpaid = dataRows(page).filter({ hasText: /Unpaid/ }).first()
  await expect(unpaid).toBeVisible()
  const invoiceNo = (await unpaid.locator('td').nth(1).innerText()).trim()
  await unpaid.locator('td').first().click()
  await expect(page).toHaveURL(/\/invoices\/\d+$/)
  const id = Number(page.url().match(/\/invoices\/(\d+)$/)?.[1])
  return { id, invoiceNo }
}

test.describe('Sidebar › Invoices › card data guard (E2E-017)', () => {
  test.describe.configure({ timeout: 240_000 })
  test.beforeEach(() => {
    runSeeder('E2EUnpaidInvoiceSeeder')
  })

  test('the API refuses a raw card number and leaves the invoice unpaid', async ({ page }) => {
    const { id, invoiceNo } = await openUnpaidInvoice(page)
    const token = await page.evaluate(() => JSON.parse(localStorage.getItem('auth') || '{}')?.state?.token)

    const res = await page.request.post(`${API_BASE_URL}/borrower/process-payment`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      data: {
        invoice_id: id,
        payment_method_id: 1,
        payment_token: JSON.stringify({ gateway: 'authorize_net', cardNumber: '4111111111111111', expMonth: '12', expYear: '34', cardCode: '123' }),
      },
    })
    expect(res.status(), await res.text()).toBe(422)
    expect((await res.json()).errors?.payment_token).toBeTruthy()

    await page.goto('/invoices')
    await expect(dataRows(page).filter({ hasText: invoiceNo })).toContainText(/Unpaid/)
  })

  test('the payment methods on offer never include a raw card form', async ({ page }) => {
    await openUnpaidInvoice(page)
    await page.getByRole('button', { name: /Pay Now/ }).click()
    const modal = page.locator('.modal.show').first()
    const cards = modal.locator('.pps-card:not(.pps-card-skeleton)')
    await expect(cards.first()).toBeVisible({ timeout: 60_000 })

    // Open every method and check that none renders a plain card-number input:
    // the only card entry allowed is Stripe's own iframe.
    const names = await cards.locator('.pps-card-name').allInnerTexts()
    for (const name of names) {
      await modal.locator('.pps-card', { hasText: name }).click()
      await expect(modal.locator('.ppm-gateway-logo-img, .ppm-gateway-icon, iframe[name^="__privateStripeFrame"]').first()).toBeVisible({ timeout: 60_000 })
      await expect(modal.locator('input[autocomplete="cc-number"], input[placeholder*="1234" i], input[name*="card" i]')).toHaveCount(0)
      const back = modal.locator('button').filter({ has: page.locator('.ri-arrow-left-line') }).first()
      await back.click()
      await expect(cards.first()).toBeVisible()
    }
  })

  test('a manual method is confirmed with a reference number only', async ({ page }) => {
    const { invoiceNo } = await openUnpaidInvoice(page)
    await page.getByRole('button', { name: /Pay Now/ }).click()
    const modal = page.locator('.modal.show').first()
    const cash = modal.locator('.pps-card:not(.pps-card-skeleton)', { hasText: 'Cash Payment' })
    await expect(cash).toBeVisible({ timeout: 60_000 })
    await cash.click()

    await modal.getByPlaceholder('Enter transaction / reference number').fill(`E2E-REF-${Date.now()}`)
    const pay = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/borrower/process-payment'), { timeout: 120_000 })
    await modal.getByRole('button', { name: /Confirm Payment/ }).click()
    const response = await pay
    const sent = JSON.parse(response.request().postDataJSON().payment_token)
    expect(sent).toMatchObject({ mode: 'manual' })
    expect(Object.keys(sent)).not.toEqual(expect.arrayContaining(['cardNumber']))
    // Wait for the server to record it before leaving the page.
    expect(response.status()).toBe(200)

    await page.goto('/invoices')
    await expect(dataRows(page).filter({ hasText: invoiceNo })).toContainText(/Processing/)
  })
})
