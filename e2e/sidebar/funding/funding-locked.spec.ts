import type { Page } from '@playwright/test'
import { test, expect, sidebarLink, pageHeading } from '../../support/fixtures'

// Funding stays closed until FCH uploads the borrower's credit report: without
// it every funding criterion reads "Failed". The API decides (`funding` on
// GET /borrower/profile/completion). Read-only.
//
// The e2e borrower's report is uploaded, so the real answer opens Funding; the
// locked cases change only that one field of the real answer.

const LOCKED_HEADING = /funding opens once your credit report is uploaded/i

/** Serves the real profile completion status with `funding` replaced. */
async function withFundingAccess(page: Page, funding: { unlocked: boolean; credit_profile_submitted: boolean }) {
  await page.route('**/api/v1/borrower/profile/completion', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    body.data = { ...body.data, funding }
    await route.fulfill({ response, json: body })
  })
}

/** Records whether the funding programs were asked for. */
function watchFundingList(page: Page) {
  const seen = { count: 0 }
  page.on('request', (request) => {
    if (/\/borrower\/funding(\?|$)/.test(request.url()) && request.method() === 'GET') seen.count++
  })
  return seen
}

test.describe('Sidebar › Funding before the credit report is uploaded', () => {
  // Calls still in flight when a test ends would fail route.fetch() and take the
  // worker down, skipping the next test.
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })

  test('opens for a borrower whose credit report is uploaded', async ({ page }) => {
    await page.goto('/')
    const funding = sidebarLink(page, 'Funding').first()
    await expect(funding).toBeVisible()

    await funding.click()
    await expect(page).toHaveURL(/\/funding$/)
    await expect(pageHeading(page, 'Funding Options')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('heading', { name: LOCKED_HEADING })).toHaveCount(0)
  })

  test('opens from the menu (no lock on it) on a page that says it waits for the report', async ({ page }) => {
    await withFundingAccess(page, { unlocked: false, credit_profile_submitted: true })
    const fundingList = watchFundingList(page)

    await page.goto('/')
    const funding = sidebarLink(page, 'Funding').first()
    await expect(funding).toBeVisible()
    await expect(funding.locator('.ri-lock-line')).toHaveCount(0)

    await funding.click()
    await expect(page).toHaveURL(/\/funding$/)
    await expect(page.getByRole('heading', { name: LOCKED_HEADING })).toBeVisible()
    await expect(page.locator('.page-content')).toContainText('Our team is preparing your credit report')

    // The three steps: credit profile done, the report in progress, Funding to come.
    const steps = page.getByRole('list', { name: 'Before Funding opens' }).getByRole('listitem')
    await expect(steps).toHaveCount(3)
    await expect(steps.nth(0)).toContainText('Done')
    await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step')
    await expect(steps.nth(1)).toContainText('In progress')
    // No funding programs, so no "Failed" readings.
    await expect(page.locator('.page-content')).not.toContainText('Failed')
    expect(fundingList.count).toBe(0)
  })

  test('a funding program link opened directly is closed too', async ({ page }) => {
    await withFundingAccess(page, { unlocked: false, credit_profile_submitted: true })

    await page.goto('/funding/1')
    await expect(page.getByRole('heading', { name: LOCKED_HEADING })).toBeVisible()

    await page.goto('/funding/1/review')
    await expect(page.getByRole('heading', { name: LOCKED_HEADING })).toBeVisible()
  })

  test('asks for the credit profile while the borrower has not submitted it', async ({ page }) => {
    await withFundingAccess(page, { unlocked: false, credit_profile_submitted: false })

    await page.goto('/funding')
    await expect(page.getByRole('heading', { name: LOCKED_HEADING })).toBeVisible()
    await page.locator('.page-content').getByRole('link', { name: /fill credit profile/i }).click()
    await expect(page).toHaveURL(/\/profile\?tab=3$/)
  })

  test('the status, title and text sit to the right of the icon', async ({ page }) => {
    await withFundingAccess(page, { unlocked: false, credit_profile_submitted: true })

    await page.goto('/funding')
    await expect(page.getByRole('heading', { name: LOCKED_HEADING })).toBeVisible()
    const icon = (await page.locator('.fl-icon').boundingBox())!
    const iconRight = icon.x + icon.width
    for (const selector of ['.fl-badge', '.fl-title', '.fl-text']) {
      const box = (await page.locator(selector).boundingBox())!
      const gap = box.x - iconRight
      expect(gap, `${selector} starts ${gap}px right of the icon`).toBeGreaterThanOrEqual(14)
      expect(gap, `${selector} starts ${gap}px right of the icon`).toBeLessThanOrEqual(20)
    }
    // The badge lines up with the top of the icon.
    const badge = (await page.locator('.fl-badge').boundingBox())!
    expect(Math.abs(badge.y - icon.y)).toBeLessThanOrEqual(2)
  })

  // custom.css colours every breadcrumb link brand navy on hover (!important),
  // which vanished into the navy banner.
  test('the banner breadcrumb stays white on hover', async ({ page }) => {
    await withFundingAccess(page, { unlocked: false, credit_profile_submitted: true })

    await page.goto('/funding')
    const dashboard = page.locator('.fp-breadcrumb').getByRole('link', { name: 'Dashboard' })
    await dashboard.hover()
    await expect(dashboard).toHaveCSS('color', 'rgb(255, 255, 255)')
  })
})
