import { test, expect, expectOk } from '../../support/fixtures'
import { openFundApplicationWizard } from '../../support/fundApplication'

// Real "Save & Next" on step 1 (Business Information) of the borrower's funding
// application. Values are left as prefilled, so saving does not change them,
// but the full save round-trip runs. (The first save starts the application,
// after which the dashboard no longer offers "Process Funding Application".)
test.describe('Funding application wizard (save)', () => {
  test('Save & Next on Business Information saves and moves to step 2', async ({ page }) => {
    test.setTimeout(300_000)
    await openFundApplicationWizard(page)
    await expect(page.getByText(/Step 1 of \d+: Business Information/).first()).toBeVisible()

    // An application that is already submitted asks first (editing needs a
    // re-signature). It is the suite's own application from an earlier run.
    const editDialog = page.getByRole('heading', { name: 'Edit Submitted Application?' })
    await page.waitForLoadState('networkidle').catch(() => {})
    if (await editDialog.isVisible()) {
      await page.getByRole('button', { name: 'Yes, Edit Application' }).click()
      await expect(editDialog).toBeHidden()
    }

    const save = page.waitForResponse((r) => r.request().method() !== 'GET' && /funding-application|fund-application/i.test(r.url()))
    await page.getByRole('button', { name: /Save & Next/ }).first().click()
    await expectOk(await save)
    await expect(page.getByText(/Step 2 of \d+/).first()).toBeVisible()
  })
})
