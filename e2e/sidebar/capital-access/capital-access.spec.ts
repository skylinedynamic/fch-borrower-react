import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

test.describe('Sidebar › Capital Access', () => {
  test('opens the overview behind the capital-access guard', async ({ page }) => {
    await openFromSidebar(page, 'Capital Access', /\/capital-access$/)
    await expect(pageHeading(page, 'Capital Access')).toBeVisible()
    await expect(page.locator('.page-content')).not.toContainText('Error loading capital access overview')
  })

  test('shows a welcome for the signed-in borrower', async ({ page }) => {
    await openFromSidebar(page, 'Capital Access', /\/capital-access$/)
    await expect(page.locator('.page-content').getByText(/Welcome back,/)).toBeVisible()
  })

  test('an unknown strategy id is rejected by the strategy guard', async ({ page }) => {
    await page.goto('/capital-access/999999/overview')
    await expect(page).not.toHaveURL(/\/capital-access\/999999\/overview$/)
  })
})
