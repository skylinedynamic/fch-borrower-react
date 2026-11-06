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

// BUG-004 (QA round 2): activity descriptions are HTML written with names
// people typed; a name like `<img src=x onerror=...>` ran script in the admin.
// The portal shows the details' text and formatting only.
test.describe('Sidebar › My Applications › application activity', () => {
  test('an activity description with HTML in it does not run', async ({ page }) => {
    await page.route('**/borrower/activity-logs/fetch-all-activities', (route) =>
      route.fulfill({
        json: {
          status: true,
          data: [{
            id: 1, event_label: 'Funding Application Submitted', log_type_raw: 'funding_application_submit', created_at: '2026-10-21T10:00:00Z',
            causer_name: 'Host Admin', description: '<p><b>Reviewed</b> for R2-XSS <img src=x onerror="window.__xss = 1"></p>',
          }],
          meta: { current_page: 1, last_page: 1, total: 1 },
        },
      })
    )
    await page.goto('/my-applications')
    const view = page.locator('.page-content a[href^="/my-applications/funding/"]').first()
    const empty = page.locator('.page-content').getByText(/No funding applications/i)
    await expect(view.or(empty)).toBeVisible()
    test.skip(!(await view.count()), 'No funding applications for this borrower')

    await view.click()
    await page.getByRole('button', { name: 'Show details' }).first().click()

    await expect(page.locator('.ma-activity-details b', { hasText: 'Reviewed' })).toBeVisible()
    await expect(page.locator('.ma-activity-details [onerror]')).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
  })
})
