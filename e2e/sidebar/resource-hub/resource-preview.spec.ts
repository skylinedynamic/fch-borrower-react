import { test, expect, openFromSidebar } from '../../support/fixtures'
import { runSeeder } from '../../support/backend'

/**
 * R3-BUG-003: resource files are private, so a resource's file_url is a signed
 * /private-files/…pdf?expires=…&signature=… link. The hub took it for a non-PDF
 * ("Preview Not Available"), and the API refuses to be framed by the portal
 * anyway. The preview now reads the file through the API and shows it from a
 * local blob: link.
 *
 * The local resources name files that are not on disk, so E2EResourcePdfSeeder
 * adds one with a real PDF, removed again afterwards.
 */
const TITLE = 'E2E Resource PDF'

test.describe('Sidebar › Resource Hub › file preview', () => {
  test.beforeAll(() => {
    runSeeder('E2EResourcePdfSeeder')
  })

  test.afterAll(() => {
    process.env.E2E_RESOURCE_PDF_REMOVE = '1'
    try {
      runSeeder('E2EResourcePdfSeeder')
    } finally {
      delete process.env.E2E_RESOURCE_PDF_REMOVE
    }
  })

  test('a private PDF shows in the preview, read through the API', async ({ page }) => {
    await openFromSidebar(page, 'Resource Hub', /\/resources$/)

    const file = page.waitForResponse((r) => /\/borrower\/resources\/\d+\/download$/.test(r.url()))
    await page.getByText(TITLE, { exact: true }).first().click()

    const response = await file
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/pdf')

    const frame = page.locator(`iframe[title="${TITLE}"]`)
    await expect(frame).toBeVisible()
    await expect(frame).toHaveAttribute('src', /^blob:/)
    await expect(page.getByText('Preview Not Available')).toHaveCount(0)
  })
})
