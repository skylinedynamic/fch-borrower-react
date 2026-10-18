import { test, expect, type Page, type Route } from '@playwright/test'

// Step 4 of 8, Funding Request: Purpose of Funds and Additional Funding Types
// are the same chip picker, several at once. Purpose of Funds is sent joined in
// the one purpose_of_funds string; "Other" among them asks for the note.
// Every backend call is answered here, at the API origin: nothing is saved.
const API_ORIGIN = 'http://127.0.0.1:8000/api/v1'

const FUNDING = {
  id: 11,
  funding_request_id: 7,
  funding_sequence_id: 3,
  status: 'Draft',
  requested_amount: '50000.00',
  purpose_of_funds: 'Working Capital, Furniture, Fixtures & Equipment (FF&E)',
  purpose_note: null,
  approved_funding: 'Term Loans',
  preferred_funding_type: 'Term Loan',
  additional_funding_types: ['SBA Loan'],
  timeframe_needed: null,
  collateral_available: null,
  is_business_info_saved: true,
  is_ownership_info_saved: true,
  is_financial_info_saved: true,
  is_funding_request_saved: true,
}

const BUSINESS = {
  id: 21,
  full_name: 'Jane Borrower',
  business_name: 'Borrower Co',
  business_email: 'jane@example.test',
  business_phone_no: '5125550100',
  business_country: 'United States',
  business_address: '9 Main St',
  business_city: 'Austin',
  business_state: 'Texas',
  business_postal_code: '78701',
  industry_type: 'Retail',
  entity_type: 'LLC',
  years_in_business: '5',
}

async function openFundingRequestStep(page: Page) {
  const user = { id: 1, name: 'Jane Borrower', email: 'jane@example.test', entity_type: 'borrower', entity_id: 1 }
  const sent: { body: Record<string, unknown> | null } = { body: null }

  await page.addInitScript(
    ([u]) => {
      window.localStorage.setItem(
        'auth',
        JSON.stringify({ state: { token: 'e2e-fake-token', user: u, rememberMe: true }, version: 0 })
      )
      document.cookie = 'auth_session_active=true; path=/'
    },
    [user]
  )

  const ok = (route: Route, data: unknown) => route.fulfill({ json: { status: true, message: 'ok', data } })
  const complete = { is_complete: true, missing_fields: [] }

  await page.route(`${API_ORIGIN}/**`, (route) => ok(route, []))
  await page.route(`${API_ORIGIN}/common/refresh-user`, (route) => ok(route, user))
  await page.route(`${API_ORIGIN}/borrower/agreement-sign/check`, (route) => ok(route, { needs_sign: false, template: null }))
  await page.route(`${API_ORIGIN}/borrower/profile/completion`, (route) =>
    ok(route, { ...complete, personal: complete, business: complete, financial: complete })
  )
  await page.route(`${API_ORIGIN}/borrower/funding`, (route) => ok(route, { groups: [] }))
  // Step 1 opens first and must read as complete before step 4 can be opened.
  await page.route(`${API_ORIGIN}/borrower/funding-application/business-info**`, (route) => ok(route, BUSINESS))
  await page.route(`${API_ORIGIN}/borrower/funding-application/funding-request**`, (route) => {
    if (route.request().method() === 'POST') {
      sent.body = route.request().postDataJSON()
      return ok(route, { ...FUNDING, ...sent.body })
    }
    return ok(route, FUNDING)
  })

  await page.goto(`/fund-application/${FUNDING.funding_request_id}`)
  await page.locator('.sidebar-step-btn', { hasText: 'Funding Request' }).first().click()
  await expect(page.getByText(/Step 4 of \d+: Funding Request/).first()).toBeVisible()

  return sent
}

const picker = (page: Page, inputId: string) =>
  // The wizard keeps a second (mobile) copy of the step in the page: the visible one.
  page.locator('.chip-multiselect', { has: page.locator(`#${inputId}`) }).locator('.p-multiselect').filter({ visible: true })

test.describe('Funding application › Step 4 › Purpose of Funds', () => {
  test('shows every saved purpose, takes another, and asks for the note with Other', async ({ page }) => {
    const sent = await openFundingRequestStep(page)

    const purposes = picker(page, 'purpose_of_funds')
    await expect(purposes.locator('.p-multiselect-token-label')).toHaveText(['Working Capital', 'Furniture, Fixtures & Equipment (FF&E)'])

    await purposes.locator('.p-multiselect-trigger').click()
    await purposes.getByPlaceholder('Search purposes').fill('Other')
    await purposes.locator('.p-multiselect-item', { hasText: /^Other$/ }).click()
    await page.keyboard.press('Escape')
    await expect(purposes.locator('.p-multiselect-token-label')).toHaveText(['Working Capital', 'Furniture, Fixtures & Equipment (FF&E)', 'Other'])

    await page.getByPlaceholder('Please specify the purpose of funds').filter({ visible: true }).fill('Trade show booth')
    await page.getByRole('button', { name: /save/i }).filter({ visible: true }).first().click()

    await expect.poll(() => sent.body?.purpose_of_funds).toBe('Working Capital, Furniture, Fixtures & Equipment (FF&E), Other')
    expect(sent.body?.purpose_note).toBe('Trade show booth')
  })

  test('both pickers look the same: chips inside a 37.5px-high field, 4px corners', async ({ page }) => {
    await openFundingRequestStep(page)

    for (const id of ['purpose_of_funds', 'additional_funding_types']) {
      const field = picker(page, id)
      await expect(field.locator('.p-multiselect-token').first()).toBeVisible()
      await expect(field).toHaveCSS('border-radius', '4px')
      const box = (await field.boundingBox())!
      expect(box.height).toBeGreaterThanOrEqual(37.5)
      for (const chip of await field.locator('.p-multiselect-token').all()) {
        const c = (await chip.boundingBox())!
        expect(c.y).toBeGreaterThanOrEqual(box.y)
        expect(c.y + c.height).toBeLessThanOrEqual(box.y + box.height)
      }
    }

    // The open list is opaque: the fields under it must not show through.
    await picker(page, 'additional_funding_types').locator('.p-multiselect-trigger').click()
    const list = picker(page, 'additional_funding_types').locator('.p-multiselect-panel')
    await expect(list).toBeVisible()
    expect(await list.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/)
    await page.keyboard.press('Escape')
    await expect(list).toBeHidden()

    // A one-row field is exactly the portal's field height.
    const additional = (await picker(page, 'additional_funding_types').boundingBox())!
    expect(Math.round(additional.height * 2) / 2).toBe(37.5)

    if (process.env.UI_SHOT) {
      const row = (await picker(page, 'purpose_of_funds').boundingBox())!
      await page.screenshot({ path: process.env.UI_SHOT, clip: { x: row.x - 20, y: row.y - 40, width: row.width + 40, height: 260 } })
      await picker(page, 'purpose_of_funds').locator('.p-multiselect-trigger').click()
      await page.waitForTimeout(500) // the list fades in
      const panel = (await picker(page, 'purpose_of_funds').locator('.p-multiselect-panel').boundingBox())!
      await page.screenshot({ path: process.env.UI_SHOT.replace('.png', '-open.png'), clip: { x: row.x - 20, y: row.y - 40, width: row.width + 40, height: panel.y + panel.height - row.y + 60 } })
    }
  })

  test('shows no focus colour: the border and shadow stay as they are at rest', async ({ page }) => {
    await openFundingRequestStep(page)

    for (const id of ['purpose_of_funds', 'additional_funding_types']) {
      const field = picker(page, id)
      const look = () => field.evaluate((el) => {
        const css = getComputedStyle(el)
        return { border: css.borderTopColor, shadow: css.boxShadow, outline: css.outlineStyle }
      })
      const atRest = await look()

      // Hovered, then focused: no change either way.
      await field.hover()
      expect(await look()).toEqual(atRest)
      await field.locator('.p-multiselect-trigger').click()
      await expect(field).toHaveClass(/p-focus|p-inputwrapper-focus/)
      expect(await look()).toEqual(atRest)

      // The search box in the list: no colour when hovered or typed in either.
      const search = field.locator('.p-multiselect-filter')
      await expect(search).toBeVisible()
      const searchLook = () => search.evaluate((el) => {
        const css = getComputedStyle(el)
        return { border: css.borderTopColor, shadow: css.boxShadow, outline: css.outlineStyle }
      })
      await page.mouse.move(0, 0)
      const searchAtRest = await searchLook()
      await search.hover()
      expect(await searchLook()).toEqual(searchAtRest)
      await search.click()
      await expect(search).toBeFocused()
      expect(await searchLook()).toEqual(searchAtRest)

      await page.keyboard.press('Escape')
      await page.mouse.move(0, 0)
    }
  })

  test("a ticked option's checkbox is in the primary colour", async ({ page }) => {
    await openFundingRequestStep(page)

    const field = picker(page, 'purpose_of_funds')
    // The chips are drawn in the primary colour: the reference.
    const primary = await field.locator('.p-multiselect-token').first().evaluate((el) => getComputedStyle(el).color)

    await field.locator('.p-multiselect-trigger').click()
    const ticked = field.locator('.p-multiselect-item', { hasText: /^Working Capital$/ }).locator('.p-checkbox-box')
    await ticked.scrollIntoViewIfNeeded()
    await expect(ticked).toBeVisible()
    await expect(ticked).toHaveCSS('background-color', primary)
    await expect(ticked).toHaveCSS('border-top-color', primary)
  })
})
