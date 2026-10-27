import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

// A loaded funding card: the loading skeleton draws placeholder .funding-card
// boxes too, but only real cards carry an id (funding-card-<id>).
const REAL_CARD = '.funding-card[id^="funding-card-"]'

test.describe('Sidebar › Funding', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Funding', /\/funding$/)
  })

  test('lists the funding option groups', async ({ page }) => {
    // GET /borrower/funding takes ~12s on the local backend.
    await expect(pageHeading(page, 'Funding Options')).toBeVisible({ timeout: 60_000 })
    await expect(page.locator('.page-content')).not.toContainText('No funding options found')
    await expect(page.locator(REAL_CARD).first()).toBeVisible()
  })

  // E2E-005: this endpoint used to run ~4,200 queries (~12s on its own, 30s+
  // behind the page's other calls on `artisan serve`). Fixed in fch-backend-api
  // by memoizing the engine's per-borrower checks; ~200 queries, ~1-3s now.
  test('GET /borrower/funding answers within 8s', async ({ page }) => {
    const funding = page.waitForResponse((r) => /\/borrower\/funding(\?|$)/.test(r.url()) && r.request().method() === 'GET')
    await page.reload()
    const response = await funding
    expect(response.status()).toBe(200)
    const { responseEnd } = response.request().timing()
    expect(responseEnd, `took ${Math.round(responseEnd)}ms`).toBeLessThan(8_000)
  })

  test('opening an available funding option shows its detail page', async ({ page }) => {
    // Pending / engine-locked cards are intentionally not clickable.
    const card = page.locator(REAL_CARD + ':not(.funding-card-disabled):not(.funding-card-locked)').first()
    await expect(card).toBeVisible({ timeout: 60_000 })
    await card.click()

    await expect(page).toHaveURL(/\/funding\/\d+$/)
    await expect(page.locator('.breadcrumb').getByRole('link', { name: 'Funding Options' })).toBeVisible()
  })

  // Only an engine-locked card is disabled; a pending request no longer blocks it (BUG-116).
  test('a disabled (engine-locked) card does not navigate', async ({ page }) => {
    await expect(page.locator(REAL_CARD).first()).toBeVisible({ timeout: 60_000 })
    const disabled = page.locator(REAL_CARD + '.funding-card-disabled').first()
    test.skip((await disabled.count()) === 0, 'No disabled funding cards for this borrower')

    await disabled.click()
    await expect(page).toHaveURL(/\/funding$/)
  })
})
