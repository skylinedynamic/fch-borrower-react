import { test, expect, openFromSidebar } from '../../support/fixtures'

// Real API, nothing written: the save is refused, so the profile is unchanged.
//
// The SSN's format is checked by the API only (App\Rules\Ssn), not by the
// portal - the field just writes the number as XXX-XX-XXXX. A number the SSA
// never issues (area 666) is nine digits, so only the server can refuse it, and
// its message has to reach the SSN field.
const SSN_INVALID = 'Enter a valid 9-digit SSN as XXX-XX-XXXX.'

test.describe('Sidebar › Profile › Personal Info — server format errors', () => {
  test('sends a malformed SSN to the API and shows its error on the field', async ({ page }) => {
    await openFromSidebar(page, 'Profile', /\/profile$/)

    const ssn = page.getByLabel(/social security number/i)
    await expect(ssn).toBeEditable()
    const onFile = await ssn.inputValue()

    await ssn.click()
    await ssn.fill('666123456')
    await expect(ssn).toHaveValue('666-12-3456')

    const res = page.waitForResponse((r) => r.url().includes('/borrower/profile/personal-info') && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    const response = await res

    expect(response.status()).toBe(422)
    expect(response.request().postDataJSON().ssn).toBe('666123456')
    await expect(page.getByText(SSN_INVALID)).toBeVisible()

    // Nothing was saved: the SSN on file reads back as before.
    await page.reload()
    await expect(page.getByLabel(/social security number/i)).toHaveValue(onFile)
  })
})
