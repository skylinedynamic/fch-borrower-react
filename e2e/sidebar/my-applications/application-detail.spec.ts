import { test, expect, pageHeading } from '../../support/fixtures'

test.describe('Sidebar › My Applications › application detail', () => {
  test('a funding application row opens its detail page with a way back', async ({ page }) => {
    await page.goto('/my-applications')
    const view = page.locator('.page-content a[href^="/my-applications/funding/"]').first()
    const empty = page.locator('.page-content').getByText(/No funding applications/i)
    await expect(view.or(empty)).toBeVisible()
    test.skip(!(await view.count()), 'No funding applications for this borrower')

    await view.click()
    await expect(page).toHaveURL(/\/my-applications\/funding\/\d+$/)
    await expect(pageHeading(page, 'Funding Application Details')).toBeVisible()

    await page.locator('.page-content .breadcrumb').getByRole('link', { name: 'My Applications' }).click()
    await expect(page).toHaveURL(/\/my-applications$/)
  })

  test('an unknown application id shows a not-found state, not a crash', async ({ page }) => {
    await page.goto('/my-applications/funding/999999999')
    // The detail request fails (400) and is retried once; on the busy local
    // server that can take a while.
    await expect(page.getByText('Application not found')).toBeVisible({ timeout: 75_000 })
    await page.getByRole('button', { name: 'Back to My Applications' }).click()
    await expect(page).toHaveURL(/\/my-applications$/)
  })
})
