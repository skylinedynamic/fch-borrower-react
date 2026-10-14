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

  test('switches tabs without leaving the page', async ({ page }) => {
    for (const tab of ['Business Details', 'Financial', 'Credit profile', 'Personal Info']) {
      await page.locator('.page-content').getByRole('button', { name: tab }).first().click()
      await expect(page).toHaveURL(/\/profile$/)
    }
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible()
  })
})
