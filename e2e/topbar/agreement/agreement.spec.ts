import { test, expect } from '../../support/fixtures'

// The agreement-builder surfaces of the borrower portal:
//  1. AgreementSignModal - shown on every portal page until the borrower signs.
//  2. /download-agreement/:userId - the signed agreement (topbar › My Agreement).
//
// The test borrower has already signed, so the sign flow runs with the two
// agreement-sign endpoints mocked: the real modal, iframe and buttons are
// exercised, and nothing is written to the database.
const TEMPLATE_HTML = `<!doctype html><html><body><div class="doc"><h1>E2E Test Agreement</h1><p>Terms.</p></div></body></html>`

test.describe('Agreement sign modal (mocked API)', () => {
  test.beforeEach(async ({ page }) => {
    // Treat the stored user as not-yet-signed for this page load.
    await page.addInitScript(() => {
      try {
        const raw = localStorage.getItem('auth')
        if (!raw) return
        const auth = JSON.parse(raw)
        if (auth?.state?.user) auth.state.user.is_agreement_signed = false
        localStorage.setItem('auth', JSON.stringify(auth))
      } catch { /* leave storage alone */ }
    })
    await page.route('**/borrower/agreement-sign/check', (route) =>
      route.fulfill({
        json: { status: true, data: { needs_sign: true, template: { id: 9999, name: 'E2E Agreement', template_html: TEMPLATE_HTML } } },
      })
    )
  })

  test('appears on the portal, shows the agreement and blocks signing until agreed', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Agreement Signing' })).toBeVisible()
    await expect(page.frameLocator('iframe.asm-iframe').getByRole('heading', { name: 'E2E Test Agreement' })).toBeVisible()

    const submit = page.locator('button.asm-btn-submit')
    await expect(submit).toBeDisabled()
    await page.locator('label.asm-checkbox-container').click()
    await expect(submit).toBeEnabled()
  })

  test('signing posts the agreement and shows the thank-you screen', async ({ page }) => {
    let posted: { agreement_template_id?: number; content_html?: string } | null = null
    await page.route('**/borrower/agreement-sign/submit', async (route) => {
      posted = route.request().postDataJSON()
      await route.fulfill({ json: { status: true, message: 'Agreement signed successfully', data: {} } })
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Agreement Signing' })).toBeVisible()
    await page.locator('label.asm-checkbox-container').click()
    await page.locator('button.asm-btn-submit').click()

    await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible()
    expect(posted).toMatchObject({ agreement_template_id: 9999 })
    expect(String(posted!.content_html)).toContain('E2E Test Agreement')

    await page.locator('button.asm-btn-proceed').click()
    await expect(page.getByRole('heading', { name: 'Agreement Signing' })).toBeHidden()
  })

  test('a failed sign keeps the modal open with an error', async ({ page }) => {
    await page.route('**/borrower/agreement-sign/submit', (route) => route.fulfill({ status: 422, json: { status: false, message: 'nope' } }))

    await page.goto('/')
    await page.locator('label.asm-checkbox-container').click()
    await page.locator('button.asm-btn-submit').click()

    await expect(page.getByText('Failed to sign agreement. Please try again.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Agreement Signing' })).toBeVisible()
  })
})

test.describe('Signed agreement page', () => {
  test('renders the signed agreement, or explains that none is on file', async ({ page }) => {
    await page.goto('/')
    const userId = await page.evaluate(() => JSON.parse(localStorage.getItem('auth') || '{}')?.state?.user?.id)

    const signed = page.waitForResponse((r) => r.url().includes(`/agreement-sign/signed-html/${userId}`))
    await page.goto(`/download-agreement/${userId}`)
    const html: string = (await (await signed).json())?.data?.content_html ?? ''
    await expect(page).toHaveURL(new RegExp(`/download-agreement/${userId}$`))

    if (html) {
      await expect(page.locator('.da-page iframe')).toBeVisible()
      await expect
        .poll(() => page.frameLocator('.da-page iframe').locator('body').innerText().then((t) => t.trim().length))
        .toBeGreaterThan(50)
      await expect(page.getByRole('button', { name: /Print/i })).toBeVisible()
    } else {
      // E2E-013: flagged as signed but no stored copy - explained, not a 404.
      await expect(page.getByRole('heading', { name: 'No signed agreement on file' })).toBeVisible()
    }
  })

  test("another user's agreement id goes to the 404 page", async ({ page }) => {
    await page.goto('/download-agreement/999999999')
    await expect(page).toHaveURL(/\/not-found$/, { timeout: 45_000 })
  })
})
