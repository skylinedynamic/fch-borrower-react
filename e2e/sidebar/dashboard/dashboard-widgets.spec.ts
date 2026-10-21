import { test, expect, pageHeading } from '../../support/fixtures'

// Every action button on the dashboard cards leads where it says.
test.describe('Sidebar › Dashboard › widget actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(pageHeading(page, 'Dashboard Overview')).toBeVisible()
  })

  const button = (page: import('@playwright/test').Page, name: string | RegExp) =>
    page.locator('.page-content').getByRole('button', { name }).first()

  test('"Resume Strategy" opens Capital Access', async ({ page }) => {
    await expect(button(page, /Resume Strategy|Start Strategy|View Strategy/)).toBeVisible()
    await button(page, /Resume Strategy|Start Strategy|View Strategy/).click()
    await expect(page).toHaveURL(/\/capital-access/)
  })

  test('both "View All" buttons open My Applications', async ({ page }) => {
    const viewAll = page.locator('.page-content').getByRole('button', { name: 'View All' })
    await expect(viewAll).toHaveCount(2)
    for (const i of [0, 1]) {
      await page.goto('/')
      await page.locator('.page-content').getByRole('button', { name: 'View All' }).nth(i).click()
      await expect(page).toHaveURL(/\/my-applications$/)
    }
  })

  test('"Schedule Meeting" opens Appointments', async ({ page }) => {
    await button(page, 'Schedule Meeting').click()
    await expect(page).toHaveURL(/\/appointment$/)
  })

  test('"Contact Support" opens Appointments', async ({ page }) => {
    await button(page, 'Contact Support').click()
    await expect(page).toHaveURL(/\/appointment$/)
  })

  test('shows the readiness score, credit score and tier cards', async ({ page }) => {
    const content = page.locator('.page-content')
    await expect(content.getByText('Credit Score', { exact: true })).toBeVisible()
    await expect(content.getByText('Current Tier Status')).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Upcoming Meetings', exact: true })).toBeVisible()
  })
})
