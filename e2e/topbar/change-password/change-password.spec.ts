import { test, expect } from '../../support/fixtures'

// Client-side validation only: a successful submit would change the shared
// test account's password.
test.describe('Topbar › Change Password page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/change-password')
    await expect(page.locator('.page-content').getByRole('heading', { name: 'Change Password' })).toBeVisible()
  })

  test('shows the three password fields', async ({ page }) => {
    await expect(page.getByPlaceholder('Enter your current password')).toBeVisible()
    await expect(page.getByPlaceholder('Enter new password')).toBeVisible()
    await expect(page.getByPlaceholder('Confirm new password')).toBeVisible()
  })

  test('an empty submit shows required-field errors', async ({ page }) => {
    await page.locator('.page-content form').locator('button[type="submit"]').click()
    await expect(page.getByText('Current password is required')).toBeVisible()
    await expect(page.getByText('New password is required')).toBeVisible()
    await expect(page.getByText('Please confirm your new password')).toBeVisible()
  })

  test('rejects a short password and a mismatched confirmation', async ({ page }) => {
    await page.getByPlaceholder('Enter your current password').fill('anything')
    await page.getByPlaceholder('Enter new password').fill('short')
    await page.getByPlaceholder('Confirm new password').fill('different')
    await page.locator('.page-content form').locator('button[type="submit"]').click()

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
    await expect(page.getByText('Passwords do not match')).toBeVisible()
    await expect(page).toHaveURL(/\/change-password$/)
  })

  test('Cancel goes back to the dashboard', async ({ page }) => {
    await page.locator('.page-content').getByRole('button', { name: /Cancel/i }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
