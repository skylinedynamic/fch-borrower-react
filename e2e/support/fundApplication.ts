import type { Page } from '@playwright/test'
import { expect } from './fixtures'
import { API_BASE_URL } from './env'

/**
 * Open the funding application wizard the way the borrower would:
 *  - an approved request not yet started → dashboard "Process Funding Application";
 *  - otherwise an application already in progress → that funding option's
 *    detail page, whose action links back into the wizard.
 * Once `fund-application-save` has saved step 1, the approved request counts as
 * started and the dashboard button disappears - so the second path is needed
 * for the suite to be repeatable.
 */
export async function openFundApplicationWizard(page: Page): Promise<void> {
  const dashboard = page.waitForResponse((r) => /\/borrower\/dashboard(\?|$)/.test(r.url()))
  await page.goto('/')
  const data = (await (await dashboard).json())?.data

  if (data?.active_approved_funding_request) {
    const process = page.getByRole('button', { name: /Process Funding Application/ })
    await expect(process).toBeVisible({ timeout: 60_000 })
    await process.click()
  } else {
    const list = page.waitForResponse((r) => /\/borrower\/funding(\?|$)/.test(r.url()) && r.request().method() === 'GET')
    await page.goto('/funding')
    const groups = (await (await list).json())?.data?.groups ?? []
    const ids: number[] = groups.flatMap((g: { sequencings: { id: number }[] }) => g.sequencings.map((s) => s.id))

    // Ask the funding-detail API which option has an editable application -
    // the same fields FundingDetail uses for its "continue" link - instead of
    // opening every detail page.
    const token = await page.evaluate(() => JSON.parse(localStorage.getItem('auth') || '{}')?.state?.token)
    let href: string | null = null
    for (const id of ids) {
      const res = await page.request.get(`${API_BASE_URL}/borrower/funding/${id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        timeout: 60_000,
      })
      const d = (await res.json())?.data
      const requestId = d?.funding_application_funding_request_id ?? d?.latest_review_id
      if (d?.funding_application_is_editable && requestId) {
        href = `/fund-application/${requestId}`
        break
      }
    }
    expect(href, 'No approved request and no editable application for this borrower').toBeTruthy()
    await page.goto(href!)
  }

  await expect(page).toHaveURL(/\/fund-application\/\d+$/)
  await expect(page.locator('.fundapplication-page h4').first()).toContainText(/Your Business Funding Application/)
}
