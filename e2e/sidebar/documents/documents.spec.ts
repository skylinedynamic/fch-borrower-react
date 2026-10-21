import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

// Read-only: no upload/remove, those change the borrower's real document set.
test.describe('Sidebar › Documents', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Documents', /\/documents$/)
  })

  test('lists the document categories', async ({ page }) => {
    await expect(pageHeading(page, 'Documents')).toBeVisible()
    for (const category of ['Driver’s License', 'Voided Business Check', 'EIN / Corporation Docs', 'Business Bank Statements']) {
      await expect(page.locator('.page-content .accordion-header').filter({ hasText: category }).first()).toBeVisible()
    }
  })

  test('each category accordion expands and collapses', async ({ page }) => {
    const header = page.locator('.page-content .accordion-header').filter({ hasText: 'Business Plan' }).getByRole('button')
    await header.click()
    const expanded = await header.getAttribute('aria-expanded')
    await header.click()
    await expect(header).not.toHaveAttribute('aria-expanded', expanded ?? '')
  })
})
