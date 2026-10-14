import { test, expect } from '../../support/fixtures'

test.describe('Error pages', () => {
  test('/access-denied shows the 403 page', async ({ page }) => {
    await page.goto('/access-denied')
    await expect(page.getByRole('heading', { name: '403' })).toBeVisible()
  })

  test('/not-found shows the 404 page', async ({ page }) => {
    await page.goto('/not-found')
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
  })

  test('"Go to Dashboard" returns home', async ({ page }) => {
    await page.goto('/not-found')
    await page.getByRole('link', { name: 'Go to Dashboard' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('the error page "back" button returns to the previous page', async ({ page }) => {
    await page.goto('/invoices')
    await page.goto('/not-found')
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/invoices$/)
  })
})
