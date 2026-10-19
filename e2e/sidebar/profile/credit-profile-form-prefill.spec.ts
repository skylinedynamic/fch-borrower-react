import { test, expect, type Page, type Route } from '@playwright/test'

// Credit Profile tab: what the request form starts from.
//
// A borrower who has already asked finds their earlier request in the form. One
// who has not finds their profile there, so a first request is not their address
// typed out again. The SSN comes from the profile only when it is the full
// number, shown masked; an older account with just the last four digits on file
// leaves that field empty. Nothing is submitted: a real submission writes an FCRA
// consent row that cannot be undone, so every backend call is answered here, at
// the API origin, and the form is only read.
const API_ORIGIN = 'http://127.0.0.1:8000/api/v1'

const PROFILE = {
  id: 1,
  first_name: 'Profile',
  middle_name: 'Middle',
  last_name: 'Person',
  email: 'profile@example.test',
  home_address: '9 Profile Way',
  city: 'Austin',
  state: 'Texas',
  zip_code: '78701',
  country: 'United States',
  country_code: 'US',
  home_phone: '',
  phone_number: '5125550100',
  // An older account: only the last four digits of the SSN on file.
  ssn: '6789',
  date_of_birth: '1990-04-05',
}

const EARLIER_REQUEST = {
  id: 11,
  borrower_id: 1,
  first_name: 'Earlier',
  middle_name: null,
  last_name: 'Request',
  address: '1 Earlier Street',
  apt_suite_other: null,
  city: 'Dallas',
  state: 'Texas',
  zip: '75001',
  ssn: '123456789',
  date_of_birth: '1985-01-02',
  phone: '2145550100',
  email: 'earlier@example.test',
}

const COMPLETE = { is_complete: true, missing_fields: [] }

async function openCreditProfileTab(page: Page, opts: { earlierRequest: boolean; profileSsn?: string | null }) {
  const user = {
    id: 1,
    name: 'Profile Person',
    email: 'profile@example.test',
    entity_type: 'borrower',
    entity_id: 1,
    credit_profile_updated: opts.earlierRequest,
  }

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

  await page.route(`${API_ORIGIN}/**`, (route) => ok(route, []))
  // The page shell reads these on every load; the shapes are the ones it expects.
  await page.route(`${API_ORIGIN}/common/refresh-user`, (route) => ok(route, user))
  await page.route(`${API_ORIGIN}/borrower/agreement-sign/check`, (route) =>
    ok(route, { needs_sign: false, template: null })
  )
  await page.route(`${API_ORIGIN}/borrower/profile/completion`, (route) =>
    ok(route, { ...COMPLETE, personal: COMPLETE, business: COMPLETE, financial: COMPLETE })
  )
  await page.route(`${API_ORIGIN}/borrower/profile/personal-info`, (route) =>
    ok(route, opts.profileSsn === undefined ? PROFILE : { ...PROFILE, ssn: opts.profileSsn })
  )
  // No pulled profile yet: with an earlier request the API answers with that
  // request, without one it answers with nothing.
  await page.route(`${API_ORIGIN}/borrower/profile/credit-profile`, (route) =>
    ok(route, opts.earlierRequest ? EARLIER_REQUEST : null)
  )
  await page.route(`${API_ORIGIN}/borrower/profile/credit-profile-request`, (route) =>
    ok(route, opts.earlierRequest ? EARLIER_REQUEST : [])
  )

  await page.goto('/profile?tab=3')
}

test.describe('Profile › Credit Profile — what the request form starts from', () => {
  test('a first request starts from the borrower profile, with only the last four SSN digits left empty', async ({ page }) => {
    await openCreditProfileTab(page, { earlierRequest: false })

    await expect(page.getByPlaceholder('123 Main Street')).toHaveValue('9 Profile Way')
    await expect(page.getByLabel(/zip code/i)).toHaveValue('78701')
    await expect(page.getByPlaceholder('e.g. Michael')).toHaveValue('Middle')
    await expect(page.getByLabel(/social security number/i)).toHaveValue('')
  })

  test('a full SSN on the profile comes in masked, and the eye button shows it', async ({ page }) => {
    await openCreditProfileTab(page, { earlierRequest: false, profileSsn: '123456789' })

    const ssn = page.getByLabel(/social security number/i)
    await expect(ssn).toHaveValue('***-**-6789')
    await page.getByRole('button', { name: /show ssn/i }).click()
    await expect(ssn).toHaveValue('123-45-6789')
  })

  test('a repeat request starts from the earlier request, not the profile', async ({ page }) => {
    await openCreditProfileTab(page, { earlierRequest: true })

    await expect(page.getByPlaceholder('123 Main Street')).toHaveValue('1 Earlier Street')
    await expect(page.getByLabel(/zip code/i)).toHaveValue('75001')
    await expect(page.getByPlaceholder('e.g. John')).toHaveValue('Earlier')
  })
})
