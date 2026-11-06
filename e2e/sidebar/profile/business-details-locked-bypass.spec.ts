import { test, expect, openFromSidebar } from '../../support/fixtures'

// Real API, nothing written: the save is refused, so the profile is unchanged.
//
// BUG-054 (QA round 2): Business Address is locked once saved - changing it is
// a Change Request. The lock was only the field's read-only attribute; with it
// removed in the browser, the save changed the address at once. The API now
// refuses it and the message shows under the field.
const LOCKED = 'This field is locked once saved. Submit a change request to update it.'

test.describe('Sidebar › Profile › Business Details — a locked field changed in the browser', () => {
  test('the API refuses a locked address changed around the read-only lock', async ({ page }) => {
    await openFromSidebar(page, 'Profile', /\/profile$/)
    await page.locator('.page-content').getByRole('button', { name: 'Business Details' }).first().click()

    const address = page.getByPlaceholder('Enter business address')
    await expect(address, 'precondition: the E2E borrower has a saved business address').toHaveAttribute('readonly', '')
    const saved = await address.inputValue()

    // What QA did: take the read-only attribute off and type a new address.
    await address.evaluate((el) => el.removeAttribute('readonly'))
    await address.fill(`${saved} - changed by E2E`)

    const res = page.waitForResponse((r) => r.url().includes('/borrower/profile/business-info') && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    const response = await res

    expect(response.status()).toBe(422)
    expect((await response.json()).errors?.business_address).toBe(LOCKED)
    await expect(page.getByText(LOCKED)).toBeVisible()

    // Nothing was saved.
    await page.reload()
    await page.locator('.page-content').getByRole('button', { name: 'Business Details' }).first().click()
    await expect(page.getByPlaceholder('Enter business address')).toHaveValue(saved)
  })
})
