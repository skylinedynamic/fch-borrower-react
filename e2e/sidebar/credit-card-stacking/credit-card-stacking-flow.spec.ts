import { test, expect, pageHeading } from '../../support/fixtures'

// The pages behind Credit Card Stacking: strategy list → play overview → pre-flight
// checklist → roadmap → step detail → completion. Read-only: no play is
// started and no step is submitted. The current play id comes from the
// overview page's "roadmap" link, so the specs follow the borrower's real data.
async function currentPlayId(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/credit-card-stacking')
  const link = page.locator('.page-content a[href*="/roadmap"]').first()
  await expect(link).toBeVisible()
  const href = (await link.getAttribute('href')) ?? ''
  const id = href.match(/\/credit-card-stacking\/(\d+)\/roadmap/)?.[1]
  expect(id, `roadmap link ${href}`).toBeTruthy()
  return id as string
}

test.describe('Sidebar › Credit Card Stacking › strategy flow', () => {
  test('the active play card opens its roadmap', async ({ page }) => {
    await page.goto('/credit-card-stacking')
    await page.locator('.page-content a[href*="/roadmap"]').first().click()
    await expect(page).toHaveURL(/\/credit-card-stacking\/\d+\/roadmap$/)
    await expect(pageHeading(page, 'Strategy Roadmap').or(pageHeading(page, /Play/))).toBeVisible()
  })

  test('strategy page features the running (or recommended) play', async ({ page }) => {
    await page.goto('/credit-card-stacking/strategy')
    await expect(pageHeading(page, 'Credit Card Stacking Strategy')).toBeVisible()
    await expect(page.locator('.page-content')).not.toContainText('No Credit Card Stacking Strategies Available')
    // The hero card shows the running play if there is one, else the recommended one.
    const hero = page.locator('.page-content .ca-hero-card-premium')
    await expect(hero).toBeVisible()
    await expect(hero.locator('h5').first()).toHaveText(/\S/)
  })

  test('play overview, pre-flight and roadmap render for the current play', async ({ page }) => {
    test.setTimeout(300_000) // four page loads in one test
    const id = await currentPlayId(page)

    await page.goto(`/credit-card-stacking/${id}/overview`)
    await expect(page).toHaveURL(new RegExp(`/credit-card-stacking/${id}/overview$`))
    await expect(page.locator('.page-content h4').first()).toBeVisible({ timeout: 90_000 })

    await page.goto(`/credit-card-stacking/${id}/pre-flight`)
    await expect(pageHeading(page, 'Pre-Flight Checklist')).toBeVisible()
    // BUG-043: a missing item names its fields and links to the profile tab that holds them.
    const missing = page.locator('.ca-checklist-missing')
    for (const hint of await missing.all()) {
      await expect(hint).toContainText('Missing:')
      await expect(hint.getByRole('link', { name: /Complete in Profile/i })).toHaveAttribute('href', '/profile?tab=1')
    }

    await page.goto(`/credit-card-stacking/${id}/roadmap`)
    await expect(page).toHaveURL(new RegExp(`/credit-card-stacking/${id}/roadmap$`))
    await expect(page.locator('.page-content h4').first()).toBeVisible({ timeout: 90_000 })
  })

  test('a roadmap step opens its detail page and goes back', async ({ page }) => {
    const id = await currentPlayId(page)
    await page.goto(`/credit-card-stacking/${id}/roadmap`)

    const step = page.locator(`.page-content a[href*="/credit-card-stacking/${id}/step/"], .page-content [role="button"][data-step-id]`).first()
    await expect(step.or(page.getByText('Roadmap Locked'))).toBeVisible()
    test.skip(!(await step.count()), 'Roadmap is locked for this borrower')

    await step.click()
    await expect(page).toHaveURL(new RegExp(`/credit-card-stacking/${id}/step/\\d+$`))
    await expect(page.locator('.page-content h4').first()).toBeVisible({ timeout: 90_000 })
  })

  test('completion page renders for the current play', async ({ page }) => {
    const id = await currentPlayId(page)
    await page.goto(`/credit-card-stacking/${id}/completion`)
    // Either the congratulations screen, or the guard sends an unfinished play elsewhere.
    await expect(pageHeading(page, 'Play Completed!').or(page.locator('.page-content h4').first())).toBeVisible()
  })

  // BUG-044: one play runs at a time. While one runs, the strategy page says
  // so above the locked plays, and opening another play by URL comes back
  // to the strategy page with the same reason.
  test('while a play runs, the other plays say why they are locked', async ({ page }) => {
    await page.goto('/credit-card-stacking/strategy')
    await expect(pageHeading(page, 'Credit Card Stacking Strategy')).toBeVisible()
    const notice = page.locator('.page-content [role="status"]').filter({ hasText: 'You can run one play at a time.' })
    await expect(notice.or(page.locator('.page-content a[href$="/overview"]')).first()).toBeVisible()
    test.skip(!(await notice.count()), 'This borrower has no running play')

    await expect(page.locator('.page-content').getByText(/locked while a play is running/)).toBeVisible()
    const runningId = (await notice.getByRole('link').getAttribute('href'))?.match(/\/credit-card-stacking\/(\d+)\/roadmap/)?.[1]
    const lockedRow = page.locator('.page-content .ca-strategy-row-premium[title^="You can run one play at a time."]').first()
    await expect(lockedRow).toBeVisible()

    // Another play's overview by URL: back to the list, with the reason.
    const otherId = String(Number(runningId) === 1 ? 2 : 1)
    await page.goto(`/credit-card-stacking/${otherId}/overview`)
    await expect(page).toHaveURL(/\/credit-card-stacking\/strategy$/, { timeout: 90_000 })
    await expect(page.locator('.Toastify').getByText(/You can run one play at a time\./)).toBeVisible()
  })

  test('a strategy id the borrower cannot use is redirected away', async ({ page }) => {
    await page.goto('/credit-card-stacking/999999/roadmap')
    await expect(page).not.toHaveURL(/\/credit-card-stacking\/999999\/roadmap$/)
  })
})
