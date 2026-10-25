import { test, expect, openFromSidebar, pageHeading, dataRows, emptyTableMessage } from '../../support/fixtures'

test.describe('Sidebar › Payments', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Payments', /\/payments$/)
  })

  test('shows the payments table once data loads', async ({ page }) => {
    await expect(pageHeading(page, 'Payments')).toBeVisible()
    for (const col of ['Payment Date', 'Invoice ID', 'Payment Method', 'Amount', 'Status']) {
      await expect(page.locator('.page-content table thead').getByText(col, { exact: true })).toBeVisible()
    }
  })

  test('clicking a row opens the payment details', async ({ page }) => {
    await expect(dataRows(page).first().or(emptyTableMessage(page))).toBeVisible()
    test.skip(await emptyTableMessage(page).isVisible(), 'No payments for this borrower')

    await dataRows(page).first().locator('td').first().click()
    await expect(page).toHaveURL(/\/payments\/\d+$/)
    await expect(pageHeading(page, 'Payment Details')).toBeVisible()
    // The header icon sits on a light tile, not the theme's dark primary.
    const tile = page.locator('.avatar-sm .avatar-title').first()
    await expect(tile.locator('i')).toBeVisible()
    await expect(tile).toHaveCSS('background-color', 'rgb(232, 231, 231)')
  })

  // BUG-062: a card payment's details held the gateway's PaymentIntent, and
  // Verification Info printed all of it - client_secret included.
  test('payment details never carry or show gateway internals', async ({ page }) => {
    await expect(dataRows(page).first().or(emptyTableMessage(page))).toBeVisible()
    test.skip(await emptyTableMessage(page).isVisible(), 'No payments for this borrower')

    const detail = page.waitForResponse((r) => /\/borrower\/payments\/\d+$/.test(r.url()) && r.request().method() === 'GET')
    await dataRows(page).first().locator('td').first().click()
    const body = await (await detail).text()

    await expect(pageHeading(page, 'Payment Details')).toBeVisible()
    for (const internal of ['client_secret', '_secret_', '"customer"', '"latest_charge"', 'input_data']) {
      expect(body).not.toContain(internal)
    }
    await expect(page.locator('.page-content')).not.toContainText(/client.secret|_secret_/i)
  })
})
