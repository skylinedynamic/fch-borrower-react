import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'
import { BORROWER_EMAIL } from '../../support/env'

// Read-only: "Save Changes" is not clicked.
test.describe('Sidebar › Profile', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Profile', /\/profile$/)
  })

  test('shows the profile tabs', async ({ page }) => {
    await expect(pageHeading(page, 'Your Profile')).toBeVisible()
    for (const tab of ['Personal Info', 'Business Details', 'Financial', 'Credit profile']) {
      await expect(page.locator('.page-content').getByRole('button', { name: tab }).first()).toBeVisible()
    }
  })

  test('Personal Info is prefilled with the signed-in account', async ({ page }) => {
    await expect(page.locator(`.page-content input[value="${BORROWER_EMAIL}"]`).first()).toBeVisible()
  })

  test('Financial marks the revenue figures required, not personal income or deposits', async ({ page }) => {
    await page.locator('.page-content').getByRole('button', { name: 'Financial' }).first().click()

    const label = (text: string) => page.locator('.page-content label.form-label', { hasText: text }).first()
    await expect(label('Annual Personal Income')).toHaveText('Annual Personal Income')
    await expect(label('Average Monthly Deposits')).toHaveText('Average Monthly Deposits')
    await expect(label('Monthly Revenue')).toContainText('*')
    await expect(label('Annual Revenue')).toContainText('*')
  })

  // Writes nothing: the tab is served with no revenue, and the save goes to the
  // real API only when it carries no revenue, which the API refuses.
  test('Financial will not save with the revenue figures empty', async ({ page }) => {
    await page.route('**/api/v1/borrower/profile/financial-info', async (route) => {
      if (route.request().method() === 'GET') {
        const response = await route.fetch()
        const body = await response.json()
        body.data = { ...body.data, monthly_revenue: null, annual_revenue: null }
        return route.fulfill({ response, json: body })
      }
      const sent = route.request().postDataJSON()
      if (sent.monthly_revenue !== null || sent.annual_revenue !== null) {
        return route.abort()
      }
      return route.continue()
    })

    await page.locator('.page-content').getByRole('button', { name: 'Financial' }).first().click()
    await expect(page.getByPlaceholder('$20,000')).toHaveValue('')

    const save = page.waitForResponse((r) => r.url().includes('/borrower/profile/financial-info') && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    expect((await save).status()).toBe(422)

    await expect(page.getByText('Monthly revenue is required')).toBeVisible()
    await expect(page.getByText('Annual revenue is required')).toBeVisible()
  })

  test('switches tabs without leaving the page', async ({ page }) => {
    for (const tab of ['Business Details', 'Financial', 'Credit profile', 'Personal Info']) {
      await page.locator('.page-content').getByRole('button', { name: tab }).first().click()
      await expect(page).toHaveURL(/\/profile$/)
    }
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible()
  })
})
