import { test, expect, pageHeading } from '../../support/fixtures'

test.describe('Sidebar › Resource Hub › resource detail', () => {
  test('a Business Services item shows its overview and impact', async ({ page }) => {
    await page.goto('/resources')
    const item = page.locator('.page-content .rh-luxe-item.cursor-pointer').first()
    await expect(item).toBeVisible()
    const title = (await item.locator('h6').first().textContent())?.trim() ?? ''

    await item.click()
    await expect(page).toHaveURL(/\/resources\/\d+$/)
    await expect(pageHeading(page, title)).toBeVisible()
    await expect(page.locator('.page-content')).not.toContainText('Loading Resource...')
  })

  test('an item without content shows the "coming soon" state', async ({ page }) => {
    await page.goto('/resources')
    await page.locator('.page-content .rh-asset-row').first().click()
    await expect(page).toHaveURL(/\/resources\/\d+$/)
    await expect(page.getByText('Guidance details coming soon.')).toBeVisible()
  })
})
