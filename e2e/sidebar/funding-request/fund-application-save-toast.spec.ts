import { test, expect, type Page, type Route } from '@playwright/test'

// Funding application (/fund-application/:id): every "Save & Next" ends with a
// message on screen. Every backend call is answered here, at the API origin:
// nothing is saved.
const API_ORIGIN = 'http://127.0.0.1:8000/api/v1'

const FUNDING = {
  id: 11,
  funding_request_id: 7,
  funding_sequence_id: 3,
  status: 'Draft',
  requested_amount: '50000.00',
  purpose_of_funds: 'Working Capital',
  approved_funding: 'Term Loans',
  is_business_info_saved: true,
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

// Already submitted and signed: every save first asks "Edit Submitted Application?".
const SUBMITTED = { ...FUNDING, status: 'Submitted – Pending Review', edit_requires_resign: true, edit_needs_confirmation: true }

async function openBusinessStep(page: Page, businessPost: (route: Route) => unknown, funding: Record<string, unknown> = FUNDING) {
  const user = { id: 1, name: 'Jane Borrower', email: 'jane@example.test', entity_type: 'borrower', entity_id: 1 }

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
  await page.route(`${API_ORIGIN}/borrower/funding-application/funding-request**`, (route) => ok(route, funding))
  await page.route(`${API_ORIGIN}/borrower/funding-application/business-info**`, (route) =>
    route.request().method() === 'POST' ? businessPost(route) : ok(route, BUSINESS)
  )

  await page.goto(`/fund-application/${FUNDING.funding_request_id}`)
  await expect(page.getByText(/Step 1 of \d+: Business Information/).first()).toBeVisible()
}

const saveAndNext = (page: Page) =>
  // The wizard keeps a second (mobile) copy of the step in the page: the visible one.
  page.getByRole('button', { name: /save & next/i }).filter({ visible: true }).first().click()

const toast = (page: Page) => page.locator('.Toastify__toast').filter({ visible: true })

test.describe('Funding application › Save & Next shows a message', () => {
  test('a successful save shows the success toast', async ({ page }) => {
    await openBusinessStep(page, (route) => route.fulfill({ json: { status: true, message: 'ok', data: BUSINESS } }))

    await saveAndNext(page)

    await expect(toast(page)).toContainText('Business information saved successfully!')
  })

  test('a validation error shows a toast as well as the highlighted fields', async ({ page }) => {
    await openBusinessStep(page, (route) =>
      route.fulfill({
        status: 422,
        json: { status: false, message: 'The business name field is required.', errors: { business_name: ['The business name field is required.'] } },
      })
    )

    await saveAndNext(page)

    await expect(toast(page)).toContainText('Please fix the highlighted fields and try again.')
  })

  test.describe('on an application that was already submitted', () => {
    const savedOk = (posts: { count: number }) => (route: Route) => {
      posts.count += 1
      return route.fulfill({ json: { status: true, message: 'ok', data: BUSINESS } })
    }
    const dialog = (page: Page) => page.getByRole('dialog', { name: /edit submitted application/i })

    // The dialog opens as soon as the page loads, before anything is typed.
    const answerOnOpen = async (page: Page, button: RegExp) => {
      await expect(dialog(page)).toBeVisible()
      await dialog(page).getByRole('button', { name: button }).click()
      await expect(dialog(page)).toBeHidden()
    }

    test('yes on open: Save & Next saves without asking again and shows the success toast', async ({ page }) => {
      const posts = { count: 0 }
      await openBusinessStep(page, savedOk(posts), SUBMITTED)
      await answerOnOpen(page, /yes, edit application/i)

      await saveAndNext(page)

      await expect(toast(page)).toContainText('Business information saved successfully!')
      expect(posts.count).toBe(1)
      await expect(page.getByText(/Step 2 of \d+: Ownership Information/).first()).toBeVisible()
    })

    test('cancel on open leaves the wizard without saving anything', async ({ page }) => {
      const posts = { count: 0 }
      await page.goto('/dashboard')
      await openBusinessStep(page, savedOk(posts), SUBMITTED)

      await expect(dialog(page)).toBeVisible()
      await dialog(page).getByRole('button', { name: /cancel/i }).click()

      await expect(page).not.toHaveURL(/\/fund-application\//)
      expect(posts.count).toBe(0)
    })
  })
})
