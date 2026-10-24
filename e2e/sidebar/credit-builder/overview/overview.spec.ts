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

  // BUG-024: the Overview and the Step-By-Step Guide give the same progress.
  test('shows the same overall progress as the Step-By-Step Guide', async ({ page }) => {
    await page.goto('/credit-builder/guide')
    const guideStat = page.locator('.stat', { hasText: 'Overall Progress' }).locator('.num')
    await expect(guideStat).toHaveText(/^\d+%$/)
    const guidePercent = (await guideStat.textContent())!.trim()

    await page.goto('/credit-builder/overview')
    const card = page.locator('.credit-progress')
    await expect(card.getByText(`${guidePercent} Overall`)).toBeVisible()
    await expect(card.getByRole('progressbar', { name: 'Overall progress' })).toHaveAttribute('aria-valuenow', guidePercent.replace('%', ''))
    await expect(card.getByText(/Tasks completed in this tier: \d+\/\d+/)).toBeVisible()
  })
})

async function openFromSidebarAfterExpand(page: Parameters<typeof openFromSidebar>[0]) {
  const link = page.locator('#creditBuilderMenu a', { hasText: 'Overview' })
  await link.click()
  await expect(page).toHaveURL(/\/credit-builder\/overview$/)
  await expect(link).toHaveClass(/active/)
}
