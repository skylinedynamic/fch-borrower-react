import { test, expect, openFromSidebar } from '../../support/fixtures'
import { runSeeder } from '../../support/backend'

// Real API. Files one change request for the E2E borrower's Business Address
// and cancels it again from the page. E2EClearBorrowerChangeRequestsSeeder also
// clears any pending request before and after, so a failed run cannot leave one
// behind to block the next.
//
// R2 BUG-039: a request for the value already on file, and a second request
// while one waits for review, were both accepted. The first is refused in the
// modal now; after a request is sent, its field says "Pending review" and
// offers no second Change Request - pressing it offers to cancel the request,
// which deletes it.
const SAME_VALUE = 'This is already the value on your profile.'

test.describe('Sidebar › Profile › Business Details — change requests', () => {
  test.beforeEach(() => {
    runSeeder('E2EClearBorrowerChangeRequestsSeeder')
  })

  test.afterEach(() => {
    runSeeder('E2EClearBorrowerChangeRequestsSeeder')
  })

  test('the value on file is refused; a new one is sent and the field then waits for review', async ({ page }) => {
    await openFromSidebar(page, 'Profile', /\/profile$/)
    await page.locator('.page-content').getByRole('button', { name: 'Business Details' }).first().click()

    const address = page.getByPlaceholder('Enter business address')
    await expect(address, 'precondition: the E2E borrower has a saved, locked business address').toHaveAttribute('readonly', '')
    const saved = await address.inputValue()
    const button = address.locator('xpath=..').locator('.change-request-btn')
    await expect(button).toHaveText('Change Request')

    // The value already on file.
    await button.click()
    const dialog = page.locator('.modal.show')
    await dialog.getByPlaceholder(/Enter the updated/).fill(saved)
    const refused = page.waitForResponse((r) => r.url().endsWith('/borrower/profile/change-request') && r.request().method() === 'POST')
    await dialog.getByRole('button', { name: 'Submit for Review' }).click()
    expect((await refused).status()).toBe(422)
    await expect(dialog.locator('.invalid-feedback', { hasText: SAME_VALUE })).toBeVisible()

    // A new value is sent.
    await dialog.getByPlaceholder(/Enter the updated/).fill(`${saved} Suite 2`)
    const sent = page.waitForResponse((r) => r.url().endsWith('/borrower/profile/change-request') && r.request().method() === 'POST')
    await dialog.getByRole('button', { name: 'Submit for Review' }).click()
    expect((await sent).status()).toBe(200)

    // The field now waits for review, and stays so after a reload.
    await expect(button).toHaveText(/Pending review/)
    await page.reload()
    await page.locator('.page-content').getByRole('button', { name: 'Business Details' }).first().click()
    const pendingButton = page.getByPlaceholder('Enter business address').locator('xpath=..').locator('.change-request-btn')
    await expect(pendingButton).toHaveText(/Pending review/)
    await expect(page.getByPlaceholder('Enter business address')).toHaveValue(saved)

    // Cancelled from the page: asked first, then deleted, and the field takes a request again.
    await pendingButton.click()
    // The app's delete modal.
    const question = page.locator('.modal.show', { hasText: 'This change request is still waiting for review.' })
    await expect(question).toBeVisible()
    // The page behind is dimmed (it was not, in development, when the modal was mounted already shown).
    await expect(page.locator('.modal-backdrop.show')).toHaveCount(1)
    const cancelled = page.waitForResponse((r) => /\/borrower\/profile\/change-requests\/\d+$/.test(r.url()) && r.request().method() === 'DELETE')
    await question.getByRole('button', { name: 'Yes, Delete It' }).click()
    expect((await cancelled).status()).toBe(200)
    // The list is fetched again after the delete; the local API can be slow.
    await expect(pendingButton).toHaveText('Change Request', { timeout: 15_000 })
  })
})
