import { test, expect, sidebar } from '../../support/fixtures'

// The header bar above every portal page: sidebar toggle, notification bell,
// user menu (Change Password / My Agreement / Logout) and the approved-funding
// banner. Logout from the topbar lives in topbar-logout.spec.ts (own session).
const userMenuButton = (page: import('@playwright/test').Page) => page.locator('header #page-header-user-dropdown')
const userMenu = (page: import('@playwright/test').Page) => page.locator('header .topbar-user .dropdown-menu')

test.describe('Topbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(sidebar(page)).toBeVisible()
  })

  test('hamburger collapses and expands the sidebar on desktop', async ({ page }) => {
    const html = page.locator('html')
    const before = (await html.getAttribute('data-sidebar-size')) || 'lg'
    const after = before === 'lg' ? 'sm' : 'lg'

    await page.locator('#topnav-hamburger-icon').click()
    await expect(html).toHaveAttribute('data-sidebar-size', after)

    await page.locator('#topnav-hamburger-icon').click()
    await expect(html).toHaveAttribute('data-sidebar-size', before)
  })

  test('user menu shows the signed-in borrower', async ({ page }) => {
    const name = await page.evaluate(() => JSON.parse(localStorage.getItem('auth') || '{}')?.state?.user?.name)
    await expect(userMenuButton(page)).toContainText(name)
  })

  test('user menu lists Change Password, My Agreement and Logout', async ({ page }) => {
    await userMenuButton(page).click()
    await expect(userMenu(page)).toBeVisible()
    await expect(userMenu(page).locator('.dropdown-item')).toHaveText([/Change Password/, /My Agreement/, /Logout/])
  })

  test('Change Password opens the change-password page', async ({ page }) => {
    await userMenuButton(page).click()
    await userMenu(page).getByText('Change Password').click()
    await expect(page).toHaveURL(/\/change-password$/)
    await expect(page.locator('.page-content').getByRole('heading', { name: 'Change Password' })).toBeVisible()
  })

  test('My Agreement opens the signed agreement in a new tab', async ({ page, context }) => {
    await userMenuButton(page).click()
    const [tab] = await Promise.all([context.waitForEvent('page'), userMenu(page).getByText('My Agreement').click()])
    await tab.waitForLoadState()

    await expect(tab).toHaveURL(/\/download-agreement\/\d+$/)
    // The signed agreement, or (no stored copy, E2E-013) an explanation - never the 404 page.
    await expect(tab.locator('.da-page iframe').or(tab.getByRole('heading', { name: 'No signed agreement on file' }))).toBeVisible({ timeout: 45_000 })
    await expect(tab).not.toHaveURL(/not-found/)
    await tab.close()
  })

  test('notification bell opens the dropdown and links to the full list', async ({ page }) => {
    const bell = page.locator('header').getByRole('button', { name: /^Notifications/ })
    await expect(bell).toBeVisible()
    await bell.click()

    const dropdown = page.locator('.notif-dropdown')
    await expect(dropdown).toBeVisible()
    await expect(dropdown.locator('.notif-header__title')).toContainText(/Notifications/)

    await dropdown.getByRole('link', { name: /View all notifications/ }).click()
    await expect(page).toHaveURL(/\/notifications$/)
  })

  test('bell badge agrees with the sidebar Notification badge', async ({ page }) => {
    const bell = page.locator('header').getByRole('button', { name: /^Notifications/ })
    const sideBadge = sidebar(page).locator('a.menu-link', { hasText: 'Notification' }).locator('.badge')
    const label = await bell.getAttribute('aria-label')
    const unread = label?.match(/(\d+\+?) unread/)?.[1]
    if (unread) await expect(sideBadge).toHaveText(unread)
    else await expect(sideBadge).toHaveCount(0)
  })

  test('approved-funding banner shows exactly when there is an unstarted approved request', async ({ page }) => {
    // Decided from the API, not a visibility timeout.
    const dashboard = page.waitForResponse((r) => /\/borrower\/dashboard(\?|$)/.test(r.url()))
    await page.reload()
    const data = (await (await dashboard).json())?.data
    const start = page.getByRole('button', { name: /Start Funding Application/ })

    if (!data?.active_approved_funding_request) {
      // Nothing approved and unstarted (e.g. after fund-application-save): no banner.
      await expect(page.locator('.page-content').first()).toBeVisible()
      await expect(start).toHaveCount(0)
      return
    }

    await expect(start).toBeVisible({ timeout: 60_000 })

    await start.click()
    await expect(page).toHaveURL(/\/fund-application\/\d+$/)
    await expect(page.locator('.fundapplication-page h4').first()).toContainText(/Your Business Funding Application/)
  })
})
