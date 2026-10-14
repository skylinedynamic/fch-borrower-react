import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

// Read-only: "Next Step" saves the borrower's personal info to the backend,
// so these specs stop short of submitting any step.
test.describe('Sidebar › Pre Qualification', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Pre Qualification', /\/pre-qualification$/)
  })

  test('shows the wizard with all five steps', async ({ page }) => {
    await expect(pageHeading(page, /Prequalify to Build Your Business Credit/)).toBeVisible()
    for (const step of ['Personal Info', 'Business Details', 'Funding Needs', 'Review', 'Underwriting Result']) {
      await expect(page.locator('.page-content').getByRole('button', { name: step }).first()).toBeVisible()
    }
  })

  test('starts on Personal Info with the borrower’s data prefilled', async ({ page }) => {
    await expect(pageHeading(page, 'Personal Info')).toBeVisible()
    const filled = page.locator('.page-content input:visible').filter({ hasNot: page.locator('[type=hidden]') })
    await expect.poll(async () => {
      const values = await filled.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value).filter(Boolean))
      return values.length
    }).toBeGreaterThan(0)
    await expect(page.locator('.page-content').getByRole('button', { name: 'Next Step' })).toBeEnabled()
  })
})
