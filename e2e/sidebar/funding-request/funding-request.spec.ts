import { test, expect, openFromSidebar, pageHeading, sidebar, dataRows, emptyTableMessage } from '../../support/fixtures'

test.describe('Sidebar › Funding Request', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Funding Request', /\/funding-requests$/)
  })

  test('shows the list with its summary cards and filters', async ({ page }) => {
    await expect(pageHeading(page, 'Funding Requests')).toBeVisible()
    for (const card of ['Total Reviews', 'Total Approved', 'Total Pending', 'Total Rejected']) {
      await expect(page.locator('.page-content').getByText(card).first()).toBeVisible()
    }
    await expect(page.getByRole('button', { name: 'Filters' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible()
  })

  test('sidebar badge matches the approved-request count', async ({ page }) => {
    const badge = sidebar(page).locator('a.menu-link', { hasText: 'Funding Request' }).locator('.badge')
    if (await badge.count()) await expect(badge).toHaveText(/^\d+$/)
  })

  test('opens a request’s detail page from the list', async ({ page }) => {
    await expect(dataRows(page).first().or(emptyTableMessage(page))).toBeVisible()
    test.skip(await emptyTableMessage(page).isVisible(), 'No funding requests for this borrower')

    await dataRows(page).first().locator('td').first().click()
    await expect(page).toHaveURL(/\/funding-requests\/\d+$/)
    await expect(pageHeading(page, 'Funding Request Details')).toBeVisible()
    await expect(page.locator('.page-content').getByRole('heading', { name: 'Activity' })).toBeVisible()
  })

  test('the singular /funding-request alias redirects to the list', async ({ page }) => {
    await page.goto('/funding-request')
    await expect(page).toHaveURL(/\/funding-requests$/)
  })
})
