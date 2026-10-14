import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

test.describe('Sidebar › My Applications', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'My Applications', /\/my-applications$/)
  })

  test('shows both application tables and the advisor panel', async ({ page }) => {
    await expect(pageHeading(page, 'My Applications')).toBeVisible()
    await expect(page.getByText('Prequalification Requests')).toBeVisible()
    await expect(page.getByText('Funding Applications', { exact: true })).toBeVisible()
    await expect(page.getByText('Your Advisor')).toBeVisible()
  })

  test('"Apply New Prequalification" goes to the pre-qualification wizard', async ({ page }) => {
    await page.getByRole('button', { name: 'Apply New Prequalification' }).or(page.getByRole('link', { name: 'Apply New Prequalification' })).click()
    await expect(page).toHaveURL(/\/pre-qualification/)
  })
})
