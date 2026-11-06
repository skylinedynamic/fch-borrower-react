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

  // BUG-169: "All Methods" / "All Types" sent the whole dropdown option, the
  // API refused it (422) and the list came back empty.
  test('choosing All Methods and All Types lists every payment again', async ({ page }) => {
    const list = () => page.waitForResponse((r) => r.url().includes('/borrower/payments/fetch-payments'))
    const total = async (res: Awaited<ReturnType<typeof list>>) => {
      expect(res.status()).toBe(200)
      return (await res.json()).meta?.total ?? 0
    }
    const pick = async (current: string, option: string) => {
      await page.locator('.p-dropdown').filter({ hasText: current }).click()
      await page.locator('.p-dropdown-item').filter({ hasText: option }).first().click()
    }
    const apply = async () => {
      const res = list()
      await page.getByRole('button', { name: 'Filters' }).click()
      return total(await res)
    }

    await expect(dataRows(page).first().or(emptyTableMessage(page))).toBeVisible()
    const unfiltered = await apply()

    await pick('All Methods', 'Stripe')
    await pick('All Types', 'Debit')
    await apply()

    await pick('Stripe', 'All Methods')
    await pick('Debit', 'All Types')
    expect(await apply()).toBe(unfiltered)
  })

  // Environment was sent but the API ignored it: "Production" still listed
  // sandbox payments. The API's total for each choice must match its rows.
  test('the Environment filter narrows the list', async ({ page }) => {
    const list = () => page.waitForResponse((r) => r.url().includes('/borrower/payments/fetch-payments'))
    const choose = async (current: string, option: string) => {
      await page.locator('.p-dropdown').filter({ hasText: current }).click()
      await page.locator('.p-dropdown-item').filter({ hasText: option }).first().click()
      const res = list()
      await page.getByRole('button', { name: 'Filters' }).click()
      const response = await res
      expect(response.status()).toBe(200)
      return (await response.json()).data as { is_environment: boolean }[]
    }

    await expect(dataRows(page).first().or(emptyTableMessage(page))).toBeVisible()

    const production = await choose('All Environment', 'Production')
    expect(production.every((p) => p.is_environment === true)).toBe(true)

    const sandbox = await choose('Production', 'Sandbox')
    expect(sandbox.every((p) => p.is_environment === false)).toBe(true)
    test.skip(sandbox.length === 0, 'No sandbox payments for this borrower')
  })

  // A commission paid to the client is recorded with the payout dialog's
  // method (Cash, Cheque, ...); the Method filter must offer and apply them.
  test('the Method filter offers the commission payout methods', async ({ page }) => {
    await expect(dataRows(page).first().or(emptyTableMessage(page))).toBeVisible()
    await page.locator('.p-dropdown').filter({ hasText: 'All Methods' }).click()
    for (const method of ['Card', 'Cash', 'Cheque', 'Paypal', 'Apple Pay', 'Google Pay']) {
      await expect(page.locator('.p-dropdown-item').filter({ hasText: new RegExp(`^${method}$`) })).toBeVisible()
    }
    await page.locator('.p-dropdown-item').filter({ hasText: /^Cheque$/ }).click()

    const res = page.waitForResponse((r) => r.url().includes('/borrower/payments/fetch-payments'))
    await page.getByRole('button', { name: 'Filters' }).click()
    const response = await res
    expect(response.status()).toBe(200)
    expect(JSON.parse(response.request().postData() ?? '{}').payment_from).toBe('Cheque')
  })

  // The Date Range filter drew the PrimeReact theme's blue focus ring; the
  // other filter inputs have none.
  test('the Date Range filter shows no focus ring', async ({ page }) => {
    const input = page.getByPlaceholder('Date Range')
    await input.click()
    await expect(page.locator('.p-datepicker')).toBeVisible()
    await expect(input).toHaveCSS('box-shadow', 'none')
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
