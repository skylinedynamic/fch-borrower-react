import { test, expect, openFromSidebar, pageHeading, sidebar } from '../../../support/fixtures'

test.describe('Sidebar › Credit Builder › Overview', () => {
  test('opens from the Credit Builder submenu', async ({ page }) => {
    await page.goto('/')
    await sidebar(page).getByRole('button', { name: /Credit Builder/ }).click()
    await openFromSidebarAfterExpand(page)
    await expect(pageHeading(page, 'Credit Building Overview')).toBeVisible()
  })

  test('/credit-builder index renders the overview', async ({ page }) => {
    await page.goto('/credit-builder')
    await expect(pageHeading(page, 'Credit Building Overview')).toBeVisible()
  })
})

async function openFromSidebarAfterExpand(page: Parameters<typeof openFromSidebar>[0]) {
  const link = page.locator('#creditBuilderMenu a', { hasText: 'Overview' })
  await link.click()
  await expect(page).toHaveURL(/\/credit-builder\/overview$/)
  await expect(link).toHaveClass(/active/)
}
