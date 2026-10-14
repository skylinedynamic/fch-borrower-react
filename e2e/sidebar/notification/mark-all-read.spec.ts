import { test, expect, pageHeading, sidebar } from '../../support/fixtures'

// Real "Mark all as read". Irreversible for the account (approved for the E2E
// borrower); when nothing is unread the button is disabled, which is checked too.
test.describe('Sidebar › Notification (mark all as read)', () => {
  test('clears every unread notification and both badges', async ({ page }) => {
    await page.goto('/notifications')
    await expect(pageHeading(page, 'Notifications')).toBeVisible()
    const button = page.getByRole('button', { name: 'Mark all as read' })
    await expect(button).toBeVisible()

    if (await button.isEnabled()) {
      const res = page.waitForResponse((r) => r.request().method() !== 'GET' && /notification/i.test(r.url()))
      await button.click()
      expect((await res).ok()).toBe(true)
    }

    await expect(button).toBeDisabled()
    await page.locator('.page-content').getByRole('tab', { name: /^Unread/ }).click()
    await expect(page.locator('.page-content .notif-pill')).toHaveCount(0)
    await expect(sidebar(page).locator('a.menu-link', { hasText: 'Notification' }).locator('.badge')).toHaveCount(0)
    await expect(page.locator('header').getByRole('button', { name: 'Notifications' })).toBeVisible()
  })
})
