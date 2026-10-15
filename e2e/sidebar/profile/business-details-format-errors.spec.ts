import { test, expect, openFromSidebar } from '../../support/fixtures'

// Real API, nothing written: the save is refused, so the profile is unchanged.
//
// ZIP, phone, SSN, EIN and D-U-N-S formats are checked by the API only (its
// shared App\Rules classes), not by the portal. This holds that a refusal from
// the real server reaches the field it belongs to. The E2E borrower has no
// D-U-N-S on file, so the field is editable; an eight-digit one is refused.
const DUNS_INVALID = 'Enter a 9-digit D-U-N-S number, e.g. 123456789.'

test.describe('Sidebar › Profile › Business Details — server format errors', () => {
  test('shows the API\'s D-U-N-S error on the field and saves nothing', async ({ page }) => {
    await openFromSidebar(page, 'Profile', /\/profile$/)
    await page.locator('.page-content').getByRole('button', { name: 'Business Details' }).first().click()

    const duns = page.getByPlaceholder('9 digit DUNS Number')
    await expect(duns).toBeEditable()
    await expect(duns, 'precondition: the E2E borrower has no D-U-N-S on file').toHaveValue('')
    await duns.fill('12345678')

    const res = page.waitForResponse((r) => r.url().includes('/borrower/profile/business-info') && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    const response = await res

    expect(response.status()).toBe(422)
    // The API sends each field's first error as a string.
    expect((await response.json()).errors?.duns_number).toBe(DUNS_INVALID)
    await expect(page.getByText(DUNS_INVALID)).toBeVisible()
    await expect(duns).toHaveClass(/is-invalid/)

    // Nothing was saved: the field is still empty after a reload.
    await page.reload()
    await page.locator('.page-content').getByRole('button', { name: 'Business Details' }).first().click()
    await expect(page.getByPlaceholder('9 digit DUNS Number')).toHaveValue('')
  })
})
