import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

test.describe('Sidebar › Resource Hub', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Resource Hub', /\/resources$/)
  })

  test('shows the hub with stats and the help panel', async ({ page }) => {
    await expect(pageHeading(page, 'Resource Hub')).toBeVisible()
    await expect(pageHeading(page, 'Education & Help')).toBeVisible()
  })

  test('a fundability item opens its resource detail page', async ({ page }) => {
    const item = page.locator('.page-content .rh-luxe-item.cursor-pointer').first()
    await expect(page.locator('.page-content .rh-luxe-item').first()).toBeVisible()
    test.skip((await item.count()) === 0, 'No fundability resources configured')

    await item.click()
    await expect(page).toHaveURL(/\/resources\/\d+$/)
  })

  test('a Training Academy video opens the video modal', async ({ page }) => {
    const video = page.locator('.page-content .rh-video-item').first()
    await expect(video).toBeVisible()

    await video.click()
    const player = page.locator('iframe.resource-modal-iframe')
    await expect(player).toBeVisible()
    await expect(player).toHaveAttribute('src', /youtube\.com\/embed\//)

    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(player).toBeHidden()
  })

  // E2E-007: items with no file or link open their detail page (which shows
  // "coming soon") instead of a dead click with a "Resource not available" toast.
  for (const [section, locator] of [
    ['Legal & Registration', '.rh-luxe-item:not(.cursor-pointer)'],
    ['Download Assets', '.rh-asset-row'],
    ['Education & Help', '.rh-edu-card'],
  ] as const) {
    test(`a ${section} item without a file opens its detail page`, async ({ page }) => {
      const item = page.locator(`.page-content ${locator}`).first()
      await expect(item).toBeVisible()
      const title = (await item.locator('h6').first().textContent())?.trim() ?? ''

      await item.click()
      // Items that do have a file/video open a modal or tab instead; this suite's
      // data has none, so a click must land on the detail page.
      await expect(page).toHaveURL(/\/resources\/\d+$/)
      await expect(pageHeading(page, title)).toBeVisible()
      await expect(page.getByText('Resource not available')).toHaveCount(0)
    })
  }
})
