import type { Locator, Page } from '@playwright/test'
import { test, expect, openFromSidebar } from '../../support/fixtures'

// Real API, nothing written.
//
// Clicking a locked Phone Number field hid its Change Request button: the phone
// fields sit in a Bootstrap .input-group, which raises a focused input to
// z-index 5 - over the button's z-index 4. The button must stay on top (and
// clickable) while its field has focus.

/** True when the button is what a click at its centre would hit. */
const isOnTop = (button: Locator) =>
  button.evaluate((el) => {
    const box = el.getBoundingClientRect()
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    return !!hit && (hit === el || el.contains(hit))
  })

async function checkPhone(page: Page, tab: string, placeholder: string) {
  await page.locator('.page-content').getByRole('button', { name: tab }).first().click()
  const phone = page.locator('.page-content').getByPlaceholder(placeholder).first()
  await expect(phone, `precondition: the E2E borrower has a saved, locked ${tab} phone`).toHaveAttribute('readonly', '')
  const button = phone.locator('xpath=ancestor::div[contains(@class,"position-relative")][1]').locator('.change-request-btn')
  await expect(button).toBeVisible()

  await phone.click()
  await expect(phone).toBeFocused()

  expect(await isOnTop(button), `${tab}: the Change Request button stays on top of the focused field`).toBe(true)
}

test.describe('Sidebar › Profile — the Change Request button on a focused phone field', () => {
  test('Business Details: Phone Number keeps its button when clicked', async ({ page }) => {
    await openFromSidebar(page, 'Profile', /\/profile$/)
    await checkPhone(page, 'Business Details', '(555) 555-5555')
  })
})
