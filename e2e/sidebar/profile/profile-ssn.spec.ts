import { test, expect, type Page, type Route } from '@playwright/test'

// The borrower's Social Security Number on the profile.
//
// Personal Info takes the full number: one on file shows masked, in full on the
// eye button; an older account holding only the last four digits is asked for
// the whole number. "Identity on file" on the Credit Profile tab offers Reveal
// only when the masked value hides something. Nothing is saved: every backend
// call is answered here, at the API origin.
const API_ORIGIN = 'http://127.0.0.1:8000/api/v1'

const PROFILE = {
  id: 1,
  first_name: 'Jane',
  middle_name: null,
  last_name: 'Borrower',
  email: 'jane@example.test',
  home_address: '9 Profile Way',
  city: 'Austin',
  state: 'Texas',
  zip_code: '78701',
  country: 'United States',
  country_code: 'US',
  home_phone: '',
  phone_number: '5125550100',
  ssn: '123456789' as string | null,
  date_of_birth: '1990-04-05',
}

const NO_METRICS = {
  fico_score: 700,
  paydex_score: null,
  experian_intelliscore: null,
  equifax_score: null,
  active_tradelines: null,
  total_credit_limit: null,
  credit_utilization: null,
  recent_inquiries: null,
  delinquent_accounts: null,
  public_records: null,
  collections: null,
  delinquencies_30_60_90: null,
  summary: null,
  all_accounts_analysis: {},
  open_accounts_analysis: {},
}

const COMPLETE = { is_complete: true, missing_fields: [] }

async function openProfile(
  page: Page,
  opts: { tab: number; profileSsn?: string | null; bureauSsn?: string | null }
) {
  const user = {
    id: 1,
    name: 'Jane Borrower',
    email: 'jane@example.test',
    entity_type: 'borrower',
    entity_id: 1,
    credit_profile_updated: opts.bureauSsn !== undefined,
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
  await page.route(`${API_ORIGIN}/borrower/profile/credit-profile`, (route) =>
    ok(
      route,
      opts.bureauSsn === undefined
        ? null
        : {
            id: 1,
            personal_info: { name: 'Jane Borrower', dob: '1990-04-05', ssn: opts.bureauSsn, email: null, phone: null },
            addresses: [],
            metrics: NO_METRICS,
          }
    )
  )

  await page.goto(`/profile?tab=${opts.tab}`)
}

test.describe('Profile › Social Security Number', () => {
  test('Personal Info shows the SSN on file masked, and in full on the eye button', async ({ page }) => {
    await openProfile(page, { tab: 0 })

    const ssn = page.getByLabel(/social security number/i)
    await expect(ssn).toHaveValue('***-**-6789')
    await page.getByRole('button', { name: /show ssn/i }).click()
    await expect(ssn).toHaveValue('123-45-6789')
  })

  test('Personal Info: a click on the field edits the SSN, no eye button needed', async ({ page }) => {
    await openProfile(page, { tab: 0 })

    const ssn = page.getByLabel(/social security number/i)
    await expect(ssn).toHaveValue('***-**-6789')
    await ssn.click()
    await expect(ssn).toHaveValue('123-45-6789')
    await expect(ssn).toHaveAttribute('type', 'password')
    await ssn.fill('')
    await ssn.pressSequentially('234567890')
    await expect(ssn).toHaveValue('234-56-7890')

    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await expect(ssn).toHaveValue('***-**-7890')
  })

  test('Credit Profile form: a click on the field edits the SSN, no eye button needed', async ({ page }) => {
    await openProfile(page, { tab: 3 })

    const ssn = page.locator('#cp-ssn')
    await expect(ssn).toHaveValue('***-**-6789')
    await ssn.click()
    await ssn.fill('')
    await ssn.pressSequentially('234567890')
    await expect(ssn).toHaveValue('234-56-7890')

    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await expect(ssn).toHaveValue('***-**-7890')
  })

  test('Personal Info asks an older account with only the last four digits for the full SSN', async ({ page }) => {
    await openProfile(page, { tab: 0, profileSsn: '6789' })

    await expect(page.getByText(/only the last 4 digits are on file/i)).toBeVisible()
    await expect(page.getByLabel(/social security number/i)).toHaveValue('')
  })

  test('Identity on file offers Reveal for a full SSN', async ({ page }) => {
    await openProfile(page, { tab: 3, bureauSsn: '123-45-6789' })

    await page.getByRole('button', { name: /identity on file/i }).click()
    await expect(page.getByText('***-**-6789')).toBeVisible()
    await page.getByRole('button', { name: /reveal/i }).click()
    await expect(page.getByText('123-45-6789')).toBeVisible()
  })

  test('Identity on file offers no Reveal when the SSN is only the last four digits', async ({ page }) => {
    await openProfile(page, { tab: 3, bureauSsn: 'XXX-XX-6789' })

    await page.getByRole('button', { name: /identity on file/i }).click()
    await expect(page.getByText('***-**-6789')).toBeVisible()
    await expect(page.getByRole('button', { name: /reveal/i })).toHaveCount(0)
  })
})
