import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

test.describe('Sidebar › My Applications', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'My Applications', /\/my-applications$/)
  })

  test('shows both application tables and the advisor panel', async ({ page }) => {
    await expect(pageHeading(page, 'My Applications')).toBeVisible()
    await expect(page.getByText('Prequalification Requests', { exact: true })).toBeVisible()
    await expect(page.getByText('Funding Applications', { exact: true })).toBeVisible()
    await expect(page.getByText('Your Advisor')).toBeVisible()
    // BUG-086: the "Ad space" placeholder is gone.
    await expect(page.getByText('Ad space')).toHaveCount(0)
    await expect(page.getByText('Advertisements')).toHaveCount(0)
  })

  test('shows the totals in the header', async ({ page }) => {
    await expect(page.getByRole('group', { name: 'Prequalification requests' }).locator('.ma-stat-value')).toHaveText(/^\d+$/)
    await expect(page.getByRole('group', { name: 'Funding applications' }).locator('.ma-stat-value')).toHaveText(/^\d+$/)
  })

  test('fits a phone screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(pageHeading(page, 'My Applications')).toBeVisible()
    await expect(page.getByText('Prequalification Requests', { exact: true })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('"Apply New Prequalification" goes to the pre-qualification wizard', async ({ page }) => {
    await page.getByRole('button', { name: 'Apply New Prequalification' }).or(page.getByRole('link', { name: 'Apply New Prequalification' })).click()
    await expect(page).toHaveURL(/\/pre-qualification/)
  })
})
