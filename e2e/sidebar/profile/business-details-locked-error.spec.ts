import { test, expect, openFromSidebar } from '../../support/fixtures'

// Read-only: the one save is answered here and never reaches the API.
//
// A locked profile field (one the API already holds) shows a "Change Request"
// button inside the input. When the API refuses that field - e.g. a phone that
// is not a real US number - the error message used to stretch the button down
// over itself and Bootstrap's invalid icon was drawn on top of it. The fix is
// CSS (assets/css/custom.css), so this asserts the real layout in the browser.
//
// The field is read-only and the borrower's stored phone is valid, so a real
// 422 cannot be produced without corrupting test data: the save is answered
// with the API's own error for business_phone instead.
const PHONE_INVALID = 'Enter a valid 10-digit US phone number, e.g. (555) 234-5678.'

test.describe('Sidebar › Profile › Business Details — locked field with an error', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Profile', /\/profile$/)
    await page.locator('.page-content').getByRole('button', { name: 'Business Details' }).first().click()
  })

  test('keeps the Change Request button inside the field and the error clear of it', async ({ page }) => {
    const field = page.locator('.position-relative').filter({ has: page.locator('input[type="tel"].locked-field-padding') }).first()
    const input = field.locator('input[type="tel"]')
    const button = field.locator('.change-request-btn')
    await expect(button).toBeVisible()

    // Measured against the input: clicking Save scrolls the page, which moves
    // every box in the viewport.
    const offsetFromInput = async () => {
      const [i, b] = [(await input.boundingBox())!, (await button.boundingBox())!]
      return { top: b.y - i.y, height: b.height }
    }
    const before = await offsetFromInput()

    await page.route('**/borrower/profile/business-info', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 422, json: { status: false, errors: { business_phone: [PHONE_INVALID] } } })
        : route.fallback()
    )
    await page.getByRole('button', { name: 'Save Changes' }).click()

    const error = field.getByText(PHONE_INVALID)
    await expect(error).toBeVisible()
    await expect(input).toHaveClass(/is-invalid/)

    const inputBox = (await input.boundingBox())!
    const buttonBox = (await button.boundingBox())!
    const errorBox = (await error.boundingBox())!

    // Same place and size as before the error appeared.
    const after = await offsetFromInput()
    expect(after.top).toBeCloseTo(before.top, 0)
    expect(after.height).toBeCloseTo(before.height, 0)
    // Inside the input, and entirely above the message.
    expect(buttonBox.y).toBeGreaterThanOrEqual(inputBox.y)
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(inputBox.y + inputBox.height)
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(errorBox.y)
    // No invalid icon under the button.
    await expect(input).toHaveCSS('background-image', 'none')
  })
})
