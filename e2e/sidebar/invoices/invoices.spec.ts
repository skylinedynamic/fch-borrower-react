import { test, expect, openFromSidebar, pageHeading, dataRows, emptyTableMessage } from '../../support/fixtures'

test.describe('Sidebar › Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Invoices', /\/invoices$/)
  })

  test('shows stats, filters and the invoice table', async ({ page }) => {
    await expect(pageHeading(page, 'Invoices')).toBeVisible()
    await expect(page.getByPlaceholder('Search invoices...')).toBeVisible()
    for (const col of ['Invoice Date', 'Invoice ID', 'Amount', 'Type', 'Status', 'Action']) {
      await expect(page.locator('.page-content table thead').getByText(col, { exact: true })).toBeVisible()
    }
  })

  test('a search with no match empties the table, Clear restores it', async ({ page }) => {
    await expect(dataRows(page).first()).toBeVisible()

    await page.getByPlaceholder('Search invoices...').fill('zz-e2e-no-such-invoice')
    await page.getByPlaceholder('Search invoices...').press('Enter')
    await expect(emptyTableMessage(page)).toBeVisible()
    // BUG-066: says nothing matched, not the free-plan lock wording.
    await expect(emptyTableMessage(page)).toContainText('No invoices match your search or filters.')
    await expect(emptyTableMessage(page)).not.toContainText('Contact your partner')

    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.getByPlaceholder('Search invoices...')).toHaveValue('')
    await expect(dataRows(page).first()).toBeVisible()
  })

  test('clicking a row opens the invoice details', async ({ page }) => {
    await expect(dataRows(page).first().or(emptyTableMessage(page))).toBeVisible()
    test.skip(await emptyTableMessage(page).isVisible(), 'No invoices for this borrower')

    await dataRows(page).first().locator('td').first().click()
    await expect(page).toHaveURL(/\/invoices\/\d+$/)
    await expect(pageHeading(page, /Invoice #/)).toBeVisible()
    await expect(page.getByText('Billed To')).toBeVisible()
  })
})
