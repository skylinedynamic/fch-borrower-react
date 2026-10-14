import { test, expect, sidebar, sidebarLink } from '../../support/fixtures'

// The sidebar itself: which items a paid/host borrower sees, and the
// behaviour shared by every item (active state, submenu, mobile toggle).
const MENU_ITEMS = [
  'Dashboard',
  'Pre Qualification',
  'Funding Request',
  'My Applications',
  'Capital Access',
  'Invoices',
  'Payments',
  'Billing Details',
  'Documents',
  'Resource Hub',
  'Appointment',
  'Funding',
  'Credit Builder',
  'Notification',
  'Profile',
  'Logout',
]

test.describe('Sidebar menu', () => {
  test('lists every menu item in order', async ({ page }) => {
    await page.goto('/')
    const items = sidebar(page).locator(':scope > li.nav-item > .menu-link')
    await expect(items).toHaveCount(MENU_ITEMS.length)
    for (const [i, label] of MENU_ITEMS.entries()) {
      await expect(items.nth(i)).toContainText(label)
    }
  })

  test('shows no lock icons for an unrestricted borrower', async ({ page }) => {
    await page.goto('/')
    await expect(sidebar(page).locator('.ri-lock-line')).toHaveCount(0)
  })

  test('highlights only the current page', async ({ page }) => {
    await page.goto('/invoices')
    await expect(sidebar(page).locator('a.active')).toHaveCount(1)
    await expect(sidebarLink(page, 'Invoices')).toHaveClass(/active/)
  })

  test('Credit Builder toggles its submenu', async ({ page }) => {
    await page.goto('/')
    const toggle = sidebar(page).getByRole('button', { name: /Credit Builder/ })
    const submenu = page.locator('#creditBuilderMenu')

    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(submenu).toHaveClass(/open/)
    await expect(submenu.getByRole('link')).toHaveText([/Overview/, /Step-By-Step Guide/, /Credit Accounts/])

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('Credit Builder submenu opens itself on a credit-builder route', async ({ page }) => {
    await page.goto('/credit-builder/guide')
    await expect(sidebar(page).getByRole('button', { name: /Credit Builder/ })).toHaveAttribute('aria-expanded', 'true')
  })

  // E2E-006: the brand box is never empty - either the tenant logo loads, or
  // (file missing / 403) BrandLogo swaps in the tenant's name. Never the host logo.
  test('brand box shows the tenant logo or, if it fails, the tenant name', async ({ page }) => {
    const branding = page.waitForResponse((r) => r.url().includes('/borrower/borrower-theme'))
    await page.goto('/invoices')
    const theme = await (await branding).json()
    const logoUrl: string = theme?.data?.branding?.logo_sidebar_full_url
    const siteName: string = theme?.data?.branding?.site_name

    const brand = page.locator('.navbar-brand-box .logo-dark .logo-lg')
    await expect
      .poll(async () => {
        const img = brand.locator('img')
        if (await img.count()) {
          return img.evaluate((el: HTMLImageElement) => (el.complete && el.naturalWidth > 0 ? 'logo' : 'loading'))
        }
        return (await brand.locator('.brand-logo-text').textContent())?.trim() ? 'name' : 'empty'
      })
      .toMatch(/^(logo|name)$/)

    if (await brand.locator('.brand-logo-text').count()) {
      await expect(brand.locator('.brand-logo-text')).toHaveText(siteName)
    } else {
      await expect(brand.locator('img')).toHaveAttribute('src', logoUrl)
    }
  })

  // E2E-008: the (theme-hidden) user dropdown carries the real user, not demo content.
  test('user dropdown has no template demo content', async ({ page }) => {
    await page.goto('/')
    const menu = page.locator('.sidebar-user .dropdown-menu')
    await expect(menu.locator('.dropdown-header')).toHaveText(/^Welcome .+!$/)
    await expect(menu).not.toContainText(/Anna|Balance|\$5971/)
    await expect(menu.locator('a[href="#"]')).toHaveCount(0)
    await expect(menu.locator('a[href="/change-password"]')).toHaveCount(1)
  })

  test('opens and closes from the hamburger on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const body = page.locator('body')
    await page.locator('#topnav-hamburger-icon').click()
    await expect(body).toHaveClass(/vertical-sidebar-enable/)

    // Picking an item navigates and closes the drawer.
    await sidebarLink(page, 'Documents').click()
    await expect(page).toHaveURL(/\/documents$/)
    await expect(body).not.toHaveClass(/vertical-sidebar-enable/)
  })
})
