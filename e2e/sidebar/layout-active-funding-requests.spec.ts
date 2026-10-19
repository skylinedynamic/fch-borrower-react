import { test, expect, type Page, type Route } from '@playwright/test'

// The layout on every page (the "Funding Request Approved" banner and the
// Funding Request badge in the sidebar) reads its own light endpoint,
// /borrower/active-funding-requests. A hard reload of any page other
// than the dashboard must not load the whole dashboard. Every backend call is
// answered here, at the API origin.
const API_ORIGIN = 'http://127.0.0.1:8000/api/v1'

const REQUEST = { id: 7, requested_amount: '45000', estimated_funding_range: '$45,000', funding_type: 'Term Loan' }

async function signIn(page: Page, activeCount: number) {
  const user = { id: 1, name: 'Jane Borrower', email: 'jane@example.test', entity_type: 'borrower', entity_id: 1 }
  const calls = { dashboard: 0, active: 0 }

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
  const complete = { is_complete: true, missing_fields: [] }
  await page.route(`${API_ORIGIN}/borrower/profile/completion`, (route) =>
    ok(route, { ...complete, personal: complete, business: complete, financial: complete })
  )
  await page.route(`${API_ORIGIN}/borrower/dashboard`, (route) => {
    calls.dashboard += 1
    // No active requests in here: the dashboard leaves them to their own endpoint.
    return ok(route, {
      states: { funding_applications: 0, funding_requests: 1, total_requested_amount: 0, total_funded_amount: 0 },
      latest_funding_applications: [],
      latest_pre_qualifications: [],
      upcoming_meeting: [],
      invoices: [],
      tier: { id: 1, name: 'tier-1', title: 'Tier 1', tasks_under_review: 0 },
    })
  })
  await page.route(`${API_ORIGIN}/borrower/active-funding-requests`, (route) => {
    calls.active += 1
    return ok(route, {
      active_approved_funding_requests: activeCount ? [REQUEST] : [],
      active_approved_funding_request: activeCount ? REQUEST : null,
      active_approved_funding_request_count: activeCount,
    })
  })

  return calls
}

// By href: the menu icon's glyph is part of the link's accessible name.
const fundingRequestLink = (page: Page) => page.locator('.navbar-nav a[href="/funding-requests"]')

test.describe('Layout › approved funding requests', () => {
  test('a hard reload of another page loads only the active requests, not the dashboard', async ({ page }) => {
    const calls = await signIn(page, 1)

    await page.goto('/payments')
    await expect(page.getByText(/your funding request has been approved/i)).toBeVisible()

    await page.reload()
    const banner = page.getByRole('alert').filter({ hasText: /your funding request has been approved/i })
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('$45,000')
    await expect(fundingRequestLink(page).locator('.badge')).toHaveText('1')

    // Once per page load: banner and sidebar share the one request.
    expect(calls.active).toBe(2)
    expect(calls.dashboard).toBe(0)
  })

  test('nothing waiting to be started: no banner, no badge', async ({ page }) => {
    const calls = await signIn(page, 0)

    await page.goto('/payments')
    await expect(fundingRequestLink(page)).toBeVisible()
    await expect(fundingRequestLink(page).locator('.badge')).toHaveCount(0)
    await expect(page.getByText(/funding request has been approved/i)).toHaveCount(0)
    expect(calls.dashboard).toBe(0)
  })

  test('the dashboard shows its Ready to Process card from the same single request', async ({ page }) => {
    const calls = await signIn(page, 1)

    await page.goto('/')
    await expect(page.getByText('Application Ready to Process')).toBeVisible()
    await expect(page.getByText('Term Loan')).toBeVisible()
    await expect.poll(() => calls.dashboard).toBe(1)
    // Shared by the banner, the sidebar badge and the card.
    expect(calls.active).toBe(1)
  })
})
