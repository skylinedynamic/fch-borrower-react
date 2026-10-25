import { test, expect, openFromSidebar, pageHeading, sidebarLink } from '../../support/fixtures'

test.describe('Sidebar › Dashboard', () => {
  test('opens from the sidebar and shows the overview KPIs', async ({ page }) => {
    await page.goto('/invoices')
    await sidebarLink(page, 'Dashboard').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(sidebarLink(page, 'Dashboard')).toHaveClass(/active/)

    await expect(pageHeading(page, /^Welcome back,/)).toBeVisible()
    for (const kpi of ['Funding Applications', 'Total Funding Requests', 'Total Requested Amount', 'Total Funded Amount']) {
      await expect(page.locator('.page-content').getByText(kpi, { exact: true })).toBeVisible()
    }
  })

  test('the hero shows the estimated access compact, like the top cards', async ({ page }) => {
    const overview = page.waitForResponse((r) => r.url().includes('/borrower/capital-access/overview') && r.ok())
    await page.goto('/')
    const data = (await (await overview).json())?.data
    expect(data?.estimated_total_access_compact, 'the API sends the compact amount').toBeTruthy()

    const hero = page.locator('.page-content [data-widget="capital-access"]')
    await expect(hero).toContainText(data.estimated_total_access_compact)
    if (data.estimated_total_access !== data.estimated_total_access_compact) {
      await expect(hero).not.toContainText(data.estimated_total_access)
    }
  })

  test('/dashboard renders the same screen as /', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(pageHeading(page, /^Welcome back,/)).toBeVisible()
    await expect(page.locator('.page-content')).not.toContainText('Error loading dashboard')
  })

  test('unknown route inside the portal shows the 404 page', async ({ page }) => {
    await openFromSidebar(page, 'Dashboard', /\/$/)
    await page.goto('/this-route-does-not-exist')
    await expect(page.locator('.page-content, body')).toContainText(/404|not found/i)
  })
})
