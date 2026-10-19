import { test, expect } from '../../support/fixtures'
import { openFundApplicationWizard } from '../../support/fundApplication'

// Step 4 of 8, Funding Request: Additional Funding Types sits after Preferred
// Funding Type and offers every funding type except the preferred one.
// Read-only: nothing is saved.
test.describe('Funding application wizard › Additional Funding Types', () => {
  test('Step 4 offers the other funding types next to the preferred one', async ({ page }) => {
    test.setTimeout(300_000)
    await openFundApplicationWizard(page)
    await page.waitForLoadState('networkidle').catch(() => {})

    // An already submitted application asks first; agreeing only opens the form.
    const editDialog = page.getByRole('heading', { name: 'Edit Submitted Application?' })
    if (await editDialog.isVisible()) {
      await page.getByRole('button', { name: 'Yes, Edit Application' }).click()
      await expect(editDialog).toBeHidden()
    }

    const step = page.locator('.side-tabs .sidebar-step-btn', { hasText: 'Funding Request' }).first()
    test.skip(await step.isDisabled(), 'The suite borrower has not saved steps 1-3 yet (run fund-application-save first).')

    const funding = page.waitForResponse((r) => /funding-application\/funding-request/.test(r.url()) && r.request().method() === 'GET')
    await step.click()
    const data = (await (await funding).json())?.data
    // The API gives the field back, saved or not.
    expect(Array.isArray(data?.additional_funding_types)).toBe(true)

    await expect(page.getByText(/Step 4 of \d+: Funding Request/).first()).toBeVisible()
    const preferredLabel = page.getByText('Preferred Funding Type', { exact: false }).first()
    const additionalLabel = page.getByText('Additional Funding Types').first()
    await expect(additionalLabel).toBeVisible()
    expect(await preferredLabel.evaluate((p, a) => !!(p.compareDocumentPosition(a as Node) & Node.DOCUMENT_POSITION_FOLLOWING), await additionalLabel.elementHandle())).toBe(true)

    // The list leaves out whatever is preferred.
    await page.locator('.additional-funding-types').first().click()
    const options = page.locator('.p-multiselect-panel li.p-multiselect-item')
    await expect(options.first()).toBeVisible()
    const offered = (await options.allTextContents()).map((t) => t.trim())
    expect(offered.length).toBeGreaterThan(0)
    if (data?.preferred_funding_type) {
      expect(offered).not.toContain(data.preferred_funding_type)
    }
  })
})
