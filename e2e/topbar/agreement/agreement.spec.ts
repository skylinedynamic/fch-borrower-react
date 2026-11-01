import { test, expect } from '../../support/fixtures'

// The agreement-builder surfaces of the borrower portal:
//  1. AgreementSignModal - shown on every portal page until the borrower signs.
//  2. /download-agreement/:userId - the signed agreement (topbar › My Agreement).
//
// The test borrower has already signed, so the sign flow runs with the two
// agreement-sign endpoints mocked: the real modal, iframe and buttons are
// exercised, and nothing is written to the database.
const TEMPLATE_HTML = `<!doctype html><html><body><form id="agreement-form"><div class="doc"><h1>E2E Test Agreement</h1><p>Terms.</p>`
  + `<label>Full Name</label><input type="text" class="p-input" data-field-id="name"/></div></form></body></html>`

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
        json: { status: true, data: { needs_sign: true, template: { id: 9999, version_id: 4242, version: 3, name: 'E2E Agreement', template_html: TEMPLATE_HTML } } },
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

  test('signing posts the version and the values entered, and shows the thank-you screen', async ({ page }) => {
    let posted: { agreement_template_id?: number; agreement_template_version_id?: number; fields?: Record<string, unknown>; content_html?: string } | null = null
    await page.route('**/borrower/agreement-sign/submit', async (route) => {
      posted = route.request().postDataJSON()
      await route.fulfill({ json: { status: true, message: 'Agreement signed successfully', data: {} } })
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Agreement Signing' })).toBeVisible()
    await page.frameLocator('iframe.asm-iframe').locator('[data-field-id="name"]').fill('Jane E2E')
    await page.locator('label.asm-checkbox-container').click()
    await page.locator('button.asm-btn-submit').click()

    await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible()
    // The server builds the signed record from the version and these values.
    expect(posted).toMatchObject({ agreement_template_id: 9999, agreement_template_version_id: 4242, fields: { name: 'Jane E2E' } })
    expect(String(posted!.content_html)).toContain('E2E Test Agreement')

    await page.locator('button.asm-btn-proceed').click()
    await expect(page.getByRole('heading', { name: 'Agreement Signing' })).toBeHidden()
  })

  test('a required field the server finds empty keeps the modal open with its message', async ({ page }) => {
    await page.route('**/borrower/agreement-sign/submit', (route) =>
      route.fulfill({ status: 422, json: { status: false, message: 'Please complete every required field of the agreement.', errors: { fields: ['name'] } } }))

    await page.goto('/')
    await page.locator('label.asm-checkbox-container').click()
    await page.locator('button.asm-btn-submit').click()

    await expect(page.getByText('Please complete every required field of the agreement.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Agreement Signing' })).toBeVisible()
  })

  test('a failed sign keeps the modal open with an error', async ({ page }) => {
    await page.route('**/borrower/agreement-sign/submit', (route) => route.fulfill({ status: 400, json: { status: false, message: 'Bad Request' } }))

    await page.goto('/')
    await page.locator('label.asm-checkbox-container').click()
    await page.locator('button.asm-btn-submit').click()

    await expect(page.getByText('Failed to sign agreement. Please try again.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Agreement Signing' })).toBeVisible()
  })
})

// The Agreement Builder's signing line (its gen()): "Sign here" over a rule, the date signed beside it.
const SIGNING_HTML = `<!doctype html><html><head></head><body><form id="agreement-form"><div class="doc"><h1>E2E Test Agreement</h1>`
  + `<div class="p-field"><label>Full Name *</label><input type="text" class="p-input" data-field-id="name" required/></div>`
  + `<div class="p-sign"><div class="p-field p-sign-col"><div class="p-sign-pad preview-dropzone" data-block-id="sig">`
  + `<span class="p-sign-tag">Sign here</span><input type="text" class="p-input" data-field-id="sig" required value="" style="position:absolute;width:0;height:0;opacity:0"/></div></div>`
  + `<div class="p-field p-sign-col p-sign-col--date"><div class="p-sign-pad"><input type="text" class="p-sig-input p-sign-date" data-field-id="sig:date" required/></div></div></div>`
  + `</div></form></body></html>`

test.describe('Guided signing (mocked API)', () => {
  test.beforeEach(async ({ page }) => {
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
      route.fulfill({ json: { status: true, data: { needs_sign: true, template: { id: 9999, version_id: 4242, version: 3, template_html: SIGNING_HTML } } } }))
  })

  test('takes the borrower through the fields, adopts a typed signature and sends it', async ({ page }) => {
    let posted: { fields?: Record<string, unknown> } | null = null
    await page.route('**/borrower/agreement-sign/submit', async (route) => {
      posted = route.request().postDataJSON()
      await route.fulfill({ json: { status: true, message: 'Agreement signed successfully', data: {} } })
    })
    const frame = page.frameLocator('iframe.asm-iframe')

    await page.goto('/')
    // The date signed fills itself: one of three required fields is done.
    await expect(page.getByText('1 of 3')).toBeVisible()
    await expect(frame.locator('[data-field-id="sig:date"]')).toHaveValue(/^\d{2} [A-Z][a-z]{2}, \d{4}$/)

    await page.getByRole('button', { name: /Start/ }).click()
    await frame.locator('[data-field-id="name"]').fill('Jane E2E')
    await expect(page.getByText('2 of 3')).toBeVisible()

    await frame.getByText('Sign here').click()
    const dialog = page.getByRole('dialog', { name: 'Adopt your signature' })
    await dialog.getByLabel('Your name').fill('Jane E2E')
    await dialog.getByRole('button', { name: 'Apply signature' }).click()

    await expect(frame.locator('[data-block-id="sig"] img')).toBeVisible()
    await expect(page.getByText('Ready to sign')).toBeVisible()
    await page.locator('label.asm-checkbox-container').click()
    await page.locator('button.asm-btn-submit').click()

    await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible()
    expect(posted!.fields).toMatchObject({ name: 'Jane E2E', sig: expect.stringMatching(/^data:image\/png;base64,/) })
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
