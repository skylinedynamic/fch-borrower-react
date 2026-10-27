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
    // The Guide's stat cards since its redesign (cg-stat).
    const guideStat = page.locator('.cg-stat', { hasText: 'Overall Progress' }).locator('.cg-stat-num')
    await expect(guideStat).toHaveText(/^\d+%$/)
    const guidePercent = (await guideStat.textContent())!.trim()

    await page.goto('/credit-builder/overview')
    const ring = page.locator('.credit-progress').getByRole('progressbar', { name: 'Overall progress' })
    await expect(ring).toHaveAttribute('aria-valuenow', guidePercent.replace('%', ''))
    await expect(ring.getByText(guidePercent)).toBeVisible()
    // The current tier is out of the tasks it needs (BUG-024).
    await expect(page.getByRole('group', { name: 'Tasks completed in this tier' }).getByText(/^\d+\/\d+$/)).toBeVisible()
  })

  test('lays out the tier roadmap with the current tier marked', async ({ page }) => {
    await page.goto('/credit-builder/overview')
    const roadmap = page.getByRole('list', { name: 'Tier roadmap' })
    await expect(roadmap).toBeVisible()
    await expect(roadmap.locator('[aria-current="step"]')).toHaveCount(1)
    // The page's own link, not the sidebar's.
    await expect(page.locator('.credit-progress').getByRole('link', { name: /Step-By-Step Guide/ })).toHaveAttribute('href', '/credit-builder/guide')
  })
})

async function openFromSidebarAfterExpand(page: Parameters<typeof openFromSidebar>[0]) {
  const link = page.locator('#creditBuilderMenu a', { hasText: 'Overview' })
  await link.click()
  await expect(page).toHaveURL(/\/credit-builder\/overview$/)
  await expect(link).toHaveClass(/active/)
}
