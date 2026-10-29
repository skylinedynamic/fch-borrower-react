import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

// Read-only: no upload/remove, those change the borrower's real document set.
test.describe('Sidebar › Documents', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Documents', /\/documents$/)
  })

  const category = (page: import('@playwright/test').Page, name: string) =>
    page.locator('.page-content button.docs-category').filter({ hasText: name }).first()

  test('lists the document categories', async ({ page }) => {
    await expect(pageHeading(page, 'Documents')).toBeVisible()
    for (const name of ['Driver’s License', 'Voided Business Check', 'EIN / Corporation Docs', 'Business Bank Statements']) {
      await expect(category(page, name)).toBeVisible()
    }
  })

  // Only these four need a document; the walkthrough's documents step and the
  // page's progress count nothing else. Holds whatever the borrower has uploaded.
  test('counts only the four required categories', async ({ page }) => {
    await expect(page.locator('.page-content .docs-stat-value').first()).toHaveText(/^\d of 4 required$/)

    for (const name of ['Driver’s License', 'Voided Business Check', 'EIN / Corporation Docs', 'Business Bank Statements']) {
      await expect(category(page, name)).not.toContainText('Optional')
    }
    for (const name of ['Business Plan', 'Business Tax Returns', 'Others']) {
      await expect(category(page, name)).toBeVisible()
      await expect(category(page, name)).not.toContainText('Not uploaded')
    }
  })

  test('choosing a category opens its uploads', async ({ page }) => {
    const plan = category(page, 'Business Plan')
    await plan.click()
    await expect(plan).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.page-content .docs-detail-title', { hasText: 'Business Plan' })).toBeVisible()
  })
})
