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
  })
})
