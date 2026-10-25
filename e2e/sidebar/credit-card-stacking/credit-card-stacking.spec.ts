import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

test.describe('Sidebar › Credit Card Stacking', () => {
  test('opens the overview behind the Credit Card Stacking guard', async ({ page }) => {
    await openFromSidebar(page, 'Credit Card Stacking', /\/credit-card-stacking$/)
    await expect(pageHeading(page, 'Credit Card Stacking')).toBeVisible()
    await expect(page.locator('.page-content')).not.toContainText('Error loading capital access overview')
  })

  test('shows a welcome for the signed-in borrower', async ({ page }) => {
    await openFromSidebar(page, 'Credit Card Stacking', /\/credit-card-stacking$/)
    await expect(page.locator('.page-content').getByText(/Welcome back,/)).toBeVisible()
  })

  test('an unknown strategy id is rejected by the strategy guard', async ({ page }) => {
    await page.goto('/credit-card-stacking/999999/overview')
    await expect(page).not.toHaveURL(/\/credit-card-stacking\/999999\/overview$/)
  })
})
