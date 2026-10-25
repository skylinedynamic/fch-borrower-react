import { test, expect, pageHeading } from '../../support/fixtures'

// A loaded funding card: the loading skeleton draws placeholder .funding-card
// boxes too, but only real cards carry an id (funding-card-<id>).
const REAL_CARD = '.funding-card[id^="funding-card-"]'

// /funding/:id/review - the funding request wizard. It either opens, or
// redirects with a toast when the borrower already applied / isn't eligible /
// already has an approved request. Read-only: nothing is submitted.
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test.describe('Sidebar › Funding › request wizard', () => {
  // Each test loads /funding (the slowest endpoint) plus one or two more pages.
  test.describe.configure({ timeout: 240_000 })

  test('a funding option detail page offers the action that fits its state', async ({ page }) => {
    await page.goto('/funding')
    const card = page.locator(REAL_CARD + ':not(.funding-card-disabled):not(.funding-card-locked)').first()
    await expect(card).toBeVisible({ timeout: 60_000 })
    await card.click()
    await expect(page).toHaveURL(/\/funding\/\d+$/)

    // FundingDetail renders one primary action, depending on state: continue or
    // process an application, view the live one, start a request, or a
    // disabled "Start Funding Request" when not eligible.
    const action = page
      .locator(
        '.page-content a[href$="/review"], .page-content a[href^="/fund-application"], .page-content a.btn[href="/my-applications"], .page-content span.btn.disabled'
      )
      .first()
    await expect(action).toBeVisible({ timeout: 60_000 })

    const href = await action.getAttribute('href')
    if (!href) return // disabled: nothing to follow
    await action.click()
    if (href.endsWith('/review')) {
      // Wizard, or one of its documented redirects (already applied / approved / not eligible).
      await expect(page).toHaveURL(/\/funding\/\d+(\/review)?$|\/fund-application/, { timeout: 60_000 })
    } else {
      await expect(page).toHaveURL(new RegExp(escapeRegExp(href) + '$'))
    }
  })

  test('/funding/:id/review opens the wizard or one of its documented redirects', async ({ page }) => {
    await page.goto('/funding')
    const card = page.locator(REAL_CARD + ':not(.funding-card-disabled):not(.funding-card-locked)').first()
    await expect(card).toBeVisible({ timeout: 60_000 })
    await card.click()
    const id = page.url().match(/\/funding\/(\d+)$/)?.[1]

    await page.goto(`/funding/${id}/review`)
    // Let the wizard settle: it stays, or redirects (already applied / approved / not eligible).
    await expect(pageHeading(page, 'Funding Request').or(page.locator('.fundapplication-page h4').first()).or(pageHeading(page, /./)).first()).toBeVisible({ timeout: 60_000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    const url = page.url()

    if (url.endsWith('/review')) {
      // The wizard itself: 4 steps, starting on the request summary.
      await expect(pageHeading(page, 'Funding Request')).toBeVisible()
      for (const step of ['Review', 'Application', 'Documents', 'Submit']) {
        await expect(page.locator('.page-content').getByText(step, { exact: true }).first()).toBeVisible()
      }
      await expect(page.getByText('Funding Request Summary')).toBeVisible()
    } else {
      expect(url).toMatch(/\/funding\/\d+$|\/fund-application/)
    }
  })

  test('an unknown funding id shows "Funding Detail Not Found"', async ({ page }) => {
    await page.goto('/funding/999999/review')
    await expect(pageHeading(page, 'Funding Detail Not Found')).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: 'Go Back' }).click()
    await expect(page).toHaveURL(/\/funding$/)
  })
})
