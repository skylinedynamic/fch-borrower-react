import { test, expect, pageHeading, sidebar } from '../../../support/fixtures'

// /credit-builder/resources is routed but has no sidebar entry; it is reached by URL.
test.describe('Credit Builder › Resources (no sidebar link)', () => {
  test('renders the Credit Resources page inside the Credit Builder section', async ({ page }) => {
    await page.goto('/credit-builder/resources')
    await expect(pageHeading(page, 'Credit Resources')).toBeVisible()
    // The Credit Builder submenu opens for any /credit-builder route.
    await expect(sidebar(page).getByRole('button', { name: /Credit Builder/ })).toHaveAttribute('aria-expanded', 'true')
  })
})
