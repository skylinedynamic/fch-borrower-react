import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

// "Mark all as read" is not clicked: it changes the borrower's real data.
test.describe('Sidebar › Notification', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Notification', /\/notifications$/)
  })

  test('shows the notification list with its tabs', async ({ page }) => {
    await expect(pageHeading(page, 'Notifications')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark all as read' })).toBeVisible()
  })

  test('switches between All, Unread and Read', async ({ page }) => {
    for (const tab of ['Unread', 'Read', 'All']) {
      const tabEl = page.locator('.page-content').getByRole('tab', { name: new RegExp(`^${tab}`) })
      await tabEl.click()
      await expect(tabEl).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('the header bell links to the same list', async ({ page }) => {
    await page.goto('/')
    await page.locator('#page-header-notifications-dropdown, .topbar-head-dropdown button').first().click()
    const viewAll = page.getByRole('link', { name: /View All|See all/i }).first()
    if (await viewAll.count()) {
      await viewAll.click()
      await expect(page).toHaveURL(/\/notifications$/)
    }
  })
})
