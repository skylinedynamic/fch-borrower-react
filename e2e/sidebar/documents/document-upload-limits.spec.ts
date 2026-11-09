import type { Page } from '@playwright/test'
import { test, expect, pageHeading } from '../../support/fixtures'

// Real API, nothing written: both uploads are refused.
//
// BUG-014 (QA round 2): the file manager took a 12 MB qa-12mb.png - the PNG
// signature and then zeros. A picture may now be up to 5 MB and has to open as
// an image. The picker refuses the large one when it is chosen; the API
// refuses the small fake one and the file manager says why.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const fakePng = (name: string, bytes: number) => ({
  name,
  mimeType: 'image/png',
  buffer: Buffer.concat([PNG_MAGIC, Buffer.alloc(bytes - PNG_MAGIC.length)]),
})
const CATEGORY = 'Miscellaneous Documents'

const fileManager = (page: Page) => page.locator('.fm-modal, .modal.show').filter({ has: page.locator('.fm-grid, .fm-list') }).first()

test.describe('Sidebar › Documents — upload size and content', () => {
  test('refuses a 12 MB fake PNG when chosen and a small fake PNG at the API', async ({ page }) => {
    await page.goto('/documents')
    await expect(pageHeading(page, 'Documents')).toBeVisible({ timeout: 90_000 })

    // Categories are listed on the left; the chosen one opens on the right.
    await page.getByRole('button', { name: new RegExp(`^${CATEGORY}`) }).click()
    await page.getByText('Click here to upload documents.').first().click()
    const fm = fileManager(page)
    await expect(fm).toBeVisible()
    await fm.getByRole('button', { name: /^Upload$/ }).click()

    // Over the 5 MB picture limit: refused as soon as it is chosen.
    await page.locator('input.fm-file-input-hidden').setInputFiles(fakePng('qa-12mb.png', 12 * 1024 * 1024))
    await expect(page.getByRole('alert')).toContainText('"qa-12mb.png" exceeds the 5MB limit.')
    await expect(page.getByRole('button', { name: /^Upload \(0\)$/ })).toBeDisabled()

    // Small enough, but not a picture: the API refuses it and says why.
    await page.locator('input.fm-file-input-hidden').setInputFiles(fakePng('qa-fake.png', 50 * 1024))
    const refused = page.waitForResponse((r) => r.url().includes('/filemanager/upload') && r.request().method() === 'POST')
    await page.getByRole('button', { name: /^Upload \(1\)$/ }).click()
    const response = await refused
    expect(response.status()).toBe(422)
    expect((await response.json()).errors?.file).toBe('This file is not a valid image.')
    await expect(page.getByText('This file is not a valid image.')).toBeVisible()
  })
})
