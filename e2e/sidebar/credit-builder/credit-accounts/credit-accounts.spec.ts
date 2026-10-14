import { test, expect, pageHeading, sidebar } from '../../../support/fixtures'

test.describe('Sidebar › Credit Builder › Credit Accounts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await sidebar(page).getByRole('button', { name: /Credit Builder/ }).click()
    const link = page.locator('#creditBuilderMenu a', { hasText: 'Credit Accounts' })
    await link.click()
    await expect(page).toHaveURL(/\/credit-builder\/credit-accounts$/)
    await expect(link).toHaveClass(/active/)
  })

  test('shows the accounts catalogue with its filters', async ({ page }) => {
    await expect(pageHeading(page, 'Credit Accounts')).toBeVisible()
    await expect(page.getByRole('button', { name: 'All Categories' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'All Issuers' })).toBeVisible()
  })
})
