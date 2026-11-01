import { test, expect, type Page, type Route } from '@playwright/test'

// Step 2, Ownership Information: the owner's Social Security Number is the same
// field as on the profile - masked ***-**-1234 at rest, edited on a click, the
// digits on the eye button.
// Every backend call is answered here, at the API origin: nothing is saved.
const API_ORIGIN = 'http://127.0.0.1:8000/api/v1'

const FUNDING = {
  id: 11,
  funding_request_id: 7,
  funding_sequence_id: 3,
  status: 'Draft',
  is_business_info_saved: true,
  is_ownership_info_saved: true,
}

const BUSINESS = {
  id: 21, full_name: 'Jane Borrower', business_name: 'Borrower Co', business_email: 'jane@example.test',
  business_phone_no: '(512) 555-0100', business_country: 'United States', business_address: '9 Main St',
  business_city: 'Austin', business_state: 'Texas', business_postal_code: '78701',
  industry_type: 'Retail', entity_type: 'LLC', years_in_business: '5',
}

const OWNER = {
  id: 31, first_name: 'Jane', last_name: 'Borrower', date_of_birth: '1990-04-05', ssn: '123456789',
  citizenship_status: 'US Citizen', street_address: '9 Main St', city: 'Austin', state: 'Texas', zip_code: '78701',
  country: 'United States', ownership_percentage: 100, phone_number: '(512) 555-0100', co_borrowers: [],
}

async function openOwnershipStep(page: Page) {
  const user = { id: 1, name: 'Jane Borrower', email: 'jane@example.test', entity_type: 'borrower', entity_id: 1 }

  await page.addInitScript(
    ([u]) => {
      window.localStorage.setItem('auth', JSON.stringify({ state: { token: 'e2e-fake-token', user: u, rememberMe: true }, version: 0 }))
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
  await page.route(`${API_ORIGIN}/borrower/funding-application/business-info**`, (route) => ok(route, BUSINESS))
  await page.route(`${API_ORIGIN}/borrower/funding-application/funding-request**`, (route) => ok(route, FUNDING))
  await page.route(`${API_ORIGIN}/borrower/funding-application/ownership-info**`, (route) => ok(route, OWNER))

  await page.goto(`/fund-application/${FUNDING.funding_request_id}`)
  await page.locator('.sidebar-step-btn', { hasText: 'Ownership' }).first().click()
}

// The wizard keeps a second (mobile) copy of the step in the page: the visible one.
const ssnField = (page: Page) => page.locator('#owner-ssn').filter({ visible: true })
const eye = (page: Page, name: RegExp) => page.getByRole('button', { name }).filter({ visible: true })

test.describe('Funding application › Step 2 › Owner SSN', () => {
  test('is masked at rest, shown on the eye button, edited on a click, and masked again', async ({ page }) => {
    await openOwnershipStep(page)

    const ssn = ssnField(page)
    await expect(ssn).toHaveValue('***-**-6789')

    await eye(page, /show ssn/i).click()
    await expect(ssn).toHaveValue('123-45-6789')
    await eye(page, /hide ssn/i).click()
    await expect(ssn).toHaveValue('***-**-6789')

    await ssn.click()
    await expect(ssn).toHaveAttribute('type', 'password')
    await ssn.fill('')
    await ssn.pressSequentially('234567890')
    await expect(ssn).toHaveValue('234-56-7890')

    // Leaving the field masks the new number again. (That the save sends the
    // nine digits is held by OwnershipInformationStep.test.tsx.)
    await page.getByText(/Step 2 of \d+: Ownership Information/).filter({ visible: true }).first().click()
    await expect(ssn).toHaveValue('***-**-7890')
    await expect(ssn).toHaveAttribute('type', 'text')
  })
})
