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

// BUG-135: a category whose only file was Rejected still showed the green tick,
// counted towards "x of 4" and Your next step moved past it. The document types
// and documents are stubbed so the category state is known.
test.describe('Sidebar › Documents - a rejected file needs a new upload', () => {
  const TYPES = [
    { id: 1, name: 'Driver’s License', sort_order: 1 },
    { id: 2, name: 'Voided Business Check', sort_order: 2 },
    { id: 3, name: 'EIN / Corporation Docs', sort_order: 3 },
    { id: 4, name: 'Business Bank Statements', sort_order: 4 },
  ]
  const doc = (id: number, typeId: number, status: string) => ({
    id, borrower_id: 5, document_type_id: typeId, file_name: `qa-file-${id}.pdf`, file_path: `${id}.pdf`, url: '', status,
    rejection_reason: status === 'Rejected' ? 'Not readable' : null,
  })

  test('ticks only accepted, shows pending as Pending review, and a rejected-only category as Re-upload needed', async ({ page }) => {
    await page.route('**/borrower/documents/borrower-document-types', (route) => route.fulfill({ json: { status: true, data: TYPES } }))
    await page.route('**/borrower/documents', (route) =>
      route.fulfill({
        json: { status: true, data: { 1: [doc(11, 1, 'Accepted')], 2: [doc(12, 2, 'Rejected')], 3: [doc(13, 3, 'Uploaded')] } },
      })
    )
    await openFromSidebar(page, 'Documents', /\/documents$/)

    // Accepted: the green tick. Waiting for review: a pending clock, not the tick.
    const licence = page.locator('.page-content button.docs-category').filter({ hasText: 'Driver’s License' }).first()
    await expect(licence.locator('.docs-category-status.is-done')).toBeVisible()
    const ein = page.locator('.page-content button.docs-category').filter({ hasText: 'EIN / Corporation Docs' }).first()
    await expect(ein).toContainText('Pending review')
    await expect(ein.locator('.docs-category-status.is-pending')).toBeVisible()
    await expect(ein.locator('.docs-category-status.is-done')).toHaveCount(0)

    const voided = page.locator('.page-content button.docs-category').filter({ hasText: 'Voided Business Check' }).first()
    await expect(voided).toContainText('Re-upload needed')
    await expect(voided.locator('.docs-category-status.is-rejected')).toBeVisible()
    await expect(voided.locator('.docs-category-status.is-done')).toHaveCount(0)

    await expect(page.getByText('2 of 4 required categories uploaded')).toBeVisible()
    await expect(page.getByRole('button', { name: /Upload Voided Business Check/ })).toBeVisible()

    // Your next step lists the required documents, the rejected one as the one to do now.
    const steps = page.getByRole('region', { name: /your next step/i }).getByRole('list', { name: 'Required documents' }).getByRole('listitem')
    await expect(steps).toHaveCount(4)
    await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step')
    await expect(steps.nth(1)).toHaveClass(/is-reupload/)
    await expect(page.getByRole('img', { name: '2 of 4 required categories uploaded' })).toHaveText('2/4')
  })

  // The hero was taller than the categories under it; it is one short band now.
  test('keeps the hero short on a wide screen', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.route('**/borrower/documents/borrower-document-types', (route) => route.fulfill({ json: { status: true, data: TYPES } }))
    await page.route('**/borrower/documents', (route) => route.fulfill({ json: { status: true, data: { 1: [doc(11, 1, 'Accepted')] } } }))
    await openFromSidebar(page, 'Documents', /\/documents$/)

    const hero = page.getByRole('region', { name: 'Documents overview' })
    await expect(hero).toBeVisible()
    const box = await hero.boundingBox()
    expect(box?.height).toBeLessThan(180)
  })
})
