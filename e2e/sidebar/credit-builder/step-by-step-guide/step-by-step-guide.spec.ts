import { test, expect, pageHeading, sidebar } from '../../../support/fixtures'

test.describe('Sidebar › Credit Builder › Step-By-Step Guide', () => {
  test('opens from the Credit Builder submenu', async ({ page }) => {
    await page.goto('/')
    await sidebar(page).getByRole('button', { name: /Credit Builder/ }).click()
    const link = page.locator('#creditBuilderMenu a', { hasText: 'Step-By-Step Guide' })
    await link.click()

    await expect(page).toHaveURL(/\/credit-builder\/guide$/)
    await expect(link).toHaveClass(/active/)
    await expect(pageHeading(page, 'Credit Building Guide')).toBeVisible()
  })
})
