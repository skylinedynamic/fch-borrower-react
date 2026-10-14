import { test, expect, pageHeading, expectOk } from '../../support/fixtures'

// Real funding request submission ("Submit for Underwriting") on the first
// funding option the borrower can still request. Each run uses up one option
// (it becomes "already applied"); the test says so plainly when none is left.
test.describe('Sidebar › Funding (submit a funding request)', () => {
  test('submits a funding request for underwriting', async ({ page }) => {
    test.setTimeout(420_000)
    const list = page.waitForResponse((r) => /\/borrower\/funding(\?|$)/.test(r.url()) && r.request().method() === 'GET')
    await page.goto('/funding')
    const groups = (await (await list).json())?.data?.groups ?? []
    const ids: number[] = groups.flatMap((g: { sequencings: { id: number }[] }) => g.sequencings.map((s) => s.id))

    let opened = false
    for (const id of ids) {
      await page.goto(`/funding/${id}/review`)
      await expect(pageHeading(page, /./).first()).toBeVisible({ timeout: 60_000 })
      await page.waitForLoadState('networkidle').catch(() => {})
      if (page.url().endsWith(`/funding/${id}/review`) && (await page.getByText('Funding Request Summary').isVisible())) {
        opened = true
        break
      }
    }
    expect(opened, 'No funding option is open for a new request - every option already has a request for this borrower').toBe(true)

    // Step 1: amount inside the option's range, and a use of funds.
    const range = (await page.locator('.page-content').getByText(/RECOMMENDED RANGE/i).locator('xpath=following-sibling::*[1]').innerText().catch(() => '')) || ''
    const min = Number((range.split('-')[0] || '').replace(/[^0-9]/g, '')) || 5000
    // The input under the "Requested Amount" label (placeholder is an example figure).
    const amount = page
      .locator('.page-content')
      .getByText('Requested Amount', { exact: true })
      .locator('xpath=following::input[1]')
    await expect(amount).toBeEditable()
    await amount.fill(String(min))
    await page.getByRole('button', { name: /Continue to Funding Request/ }).click()

    // Use of funds (multi-select) if the step asks for it.
    const errorUse = page.getByText('Use of funds is required')
    if (await errorUse.isVisible().catch(() => false)) {
      await page.locator('.page-content .p-multiselect, .page-content .dropdown .form-select').first().click()
      await page.locator('.p-multiselect-item, .list-group-item-action').first().click()
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: /Continue to Funding Request/ }).click()
    }

    await page.getByRole('button', { name: /Continue to Documents/ }).click()
    const submit = page.waitForResponse((r) => r.request().method() === 'POST' && /funding\/requests$/.test(r.url()), { timeout: 300_000 })
    await page.getByRole('button', { name: /Submit for Underwriting/ }).click()
    const res = await submit
    await expectOk(res)
    await expect(page.getByText('What Happens Next?')).toBeVisible({ timeout: 120_000 })
  })
})
