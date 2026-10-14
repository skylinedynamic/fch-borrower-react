import path from 'node:path'
import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { test, expect, pageHeading } from '../../support/fixtures'

// Real upload through the File Manager, attach to a document category, remove
// it from the category, and delete the uploaded file - everything ends as it
// started. The backend prefixes uploads with a timestamp
// (`1791887761_e2e-....pdf`), so files are matched by suffix.
const FIXTURE = path.resolve(process.cwd(), 'e2e/fixtures/e2e-test-document.pdf')
const CATEGORY = 'Miscellaneous Documents'
const E2E_FILE = /_e2e-\d+\.pdf$/

const fileManager = (page: Page) => page.locator('.fm-modal, .modal.show').filter({ has: page.locator('.fm-grid, .fm-list') }).first()

async function deleteE2EFilesFromFileManager(page: Page) {
  const fm = fileManager(page)
  for (let i = 0; i < 10; i++) {
    const titles = await fm.locator('.fm-grid-item').evaluateAll((els) => els.map((e) => e.getAttribute('title') || ''))
    const target = titles.find((t) => E2E_FILE.test(t))
    if (!target) return
    await fm.locator(`.fm-grid-item[title="${target}"]`).click({ button: 'right' })
    await page.locator('.fm-context-menu-item.danger', { hasText: 'Delete' }).click()
    const del = page.waitForResponse((r) => r.url().includes('/filemanager/delete'))
    await page.locator('.fm-btn-danger').click()
    expect((await del).ok()).toBe(true)
    await expect(fm.locator(`.fm-grid-item[title="${target}"]`)).toHaveCount(0)
  }
}

test.describe('Sidebar › Documents (upload / remove)', () => {
  test('uploads a file into a category, removes it, and deletes the upload', async ({ page }) => {
    test.setTimeout(300_000)
    await page.goto('/documents')
    await expect(pageHeading(page, 'Documents')).toBeVisible({ timeout: 90_000 })

    const section = page.locator('.page-content .accordion-item').filter({ has: page.locator('.accordion-header', { hasText: CATEGORY }) })
    const header = section.locator('.accordion-header button')
    if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click()
    const before = await section.locator('.file-list .list-group-item').count()

    const name = `e2e-${Date.now()}.pdf`
    await section.getByText('Click here to upload documents.').click()
    const fm = fileManager(page)
    await expect(fm).toBeVisible()

    // Upload into the file manager.
    await fm.getByRole('button', { name: /^Upload$/ }).click()
    await page.locator('input.fm-file-input-hidden').setInputFiles({ name, mimeType: 'application/pdf', buffer: readFileSync(FIXTURE) })
    const upload = page.waitForResponse((r) => r.url().includes('/filemanager/upload'))
    await page.getByRole('button', { name: /^Upload \(1\)$/ }).click()
    expect((await upload).ok()).toBe(true)
    await page.getByRole('button', { name: 'Done' }).click()

    // Select it and attach it to the category.
    const item = fm.locator(`.fm-grid-item[title$="_${name}"], .fm-grid-item[title="${name}"]`).first()
    await expect(item).toBeVisible()
    const storedName = (await item.getAttribute('title')) ?? name
    await item.click()
    const attach = page.waitForResponse((r) => r.url().includes('/borrower/documents/upload'))
    await page.locator('.fm-floating-select-btn').click()
    expect((await attach).ok()).toBe(true)
    await expect(page.locator('.Toastify__toast--success').filter({ hasText: CATEGORY }).first()).toBeVisible()

    const row = section.locator('.file-list .list-group-item').filter({ hasText: name })
    await expect(row).toBeVisible()
    await expect(section.locator('.file-list .list-group-item')).toHaveCount(before + 1)

    // Remove it from the category.
    await row.getByRole('button', { name: /Remove/ }).click()
    const del = page.waitForResponse((r) => r.request().method() === 'DELETE' && r.url().includes('/borrower/documents/'))
    await page.locator('.modal.show').getByRole('button', { name: /Delete|Yes|Confirm/i }).last().click()
    expect((await del).ok()).toBe(true)
    await expect(row).toHaveCount(0)
    await expect(section.locator('.file-list .list-group-item')).toHaveCount(before)

    // Delete the uploaded file (and any earlier run's leftovers) from the file manager.
    await section.getByText('Click here to upload documents.').click()
    await expect(fileManager(page)).toBeVisible()
    await deleteE2EFilesFromFileManager(page)
    await expect(fileManager(page).locator(`.fm-grid-item[title="${storedName}"]`)).toHaveCount(0)
  })
})
