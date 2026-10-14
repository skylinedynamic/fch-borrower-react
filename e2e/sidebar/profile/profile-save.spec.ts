import { test, expect, pageHeading } from '../../support/fixtures'

// Real save of Personal Info: change the address, save, reload and see it
// persisted, then save the original back.
test.describe('Sidebar › Profile (save)', () => {
  test('saving Personal Info persists the change', async ({ page }) => {
    test.setTimeout(240_000)
    await page.goto('/profile')
    await expect(pageHeading(page, 'Your Profile')).toBeVisible()

    const address = page.getByPlaceholder('Enter address').first()
    await expect(address).toBeEditable()
    const original = await address.inputValue()
    const changed = `E2E ${Date.now()} Test Street`

    const save = async (value: string) => {
      await address.fill(value)
      const res = page.waitForResponse((r) => r.url().includes('/borrower/profile/personal-info') && r.request().method() === 'POST')
      await page.getByRole('button', { name: 'Save Changes' }).first().click()
      const response = await res
      expect(response.status(), await response.text()).toBe(200)
      expect((await response.json()).status).toBe(true)
      await expect(page.locator('.Toastify__toast--success').first()).toBeVisible()
    }

    try {
      await save(changed)
      await page.reload()
      await expect(page.getByPlaceholder('Enter address').first()).toHaveValue(changed)
    } finally {
      // Put the original back even if an assertion above failed.
      await page.goto('/profile')
      await expect(page.getByPlaceholder('Enter address').first()).toBeEditable()
      await save(original)
    }
  })
})
