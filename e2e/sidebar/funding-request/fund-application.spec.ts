import { test, expect } from '../../support/fixtures'
import { openFundApplicationWizard } from '../../support/fundApplication'

// The funding application wizard reached from an approved funding request
// (dashboard) or an application in progress (funding option detail).
// Read-only: the wizard is opened and its first step checked.
test.describe('Funding application wizard', () => {
  test('opens from the dashboard or the funding option it belongs to', async ({ page }) => {
    test.setTimeout(240_000)
    await openFundApplicationWizard(page)
  })

  test('shows the Business Information step prefilled from the profile', async ({ page }) => {
    test.setTimeout(240_000)
    await openFundApplicationWizard(page)
    await expect(page.getByText(/Step 1 of \d+: Business Information/).first()).toBeVisible()
    await expect(page.getByPlaceholder('Enter business name').first()).toHaveValue(/.+/)
  })

  test('a submitted application asks before editing, and Cancel leaves it untouched', async ({ page }) => {
    test.setTimeout(240_000)
    await openFundApplicationWizard(page)
    await page.waitForLoadState('networkidle').catch(() => {})
    const editDialog = page.getByRole('heading', { name: 'Edit Submitted Application?' })
    // Only applications that are already submitted ask; a fresh one opens straight in.
    if (!(await editDialog.isVisible())) return

    const dialog = page.locator('.modal.show').filter({ has: editDialog })
    await expect(dialog).toContainText('Re-signature required')
    let wrote = false
    page.on('request', (r) => { if (r.method() !== 'GET' && /fund-?application/i.test(r.url())) wrote = true })
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(page).not.toHaveURL(/\/fund-application\/\d+$/)
    expect(wrote, 'Cancel must not save anything').toBe(false)
  })

  test('/fund-application without an id still loads the wizard', async ({ page }) => {
    await page.goto('/fund-application')
    await expect(page.locator('.fundapplication-page h4').first()).toContainText(/Your Business Funding Application/)
  })
})
