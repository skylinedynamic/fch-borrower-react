import { test, expect, type Route } from '@playwright/test'

// The host requires a borrower's agreement while the borrower is using the
// portal. The API flags them (is_refresh); their next call has the portal look
// at user-details, reload the user (refresh-user), and the sign modal opens -
// no full reload. Then the host waives it, and the modal closes the same way.
// Every backend call is answered here, at the API origin.
const API_ORIGIN = 'http://127.0.0.1:8000/api/v1'
const USER = { id: 1, name: 'Jane Borrower', email: 'jane@example.test', entity_type: 'borrower', entity_id: 1, is_agreement_signed: false }
const TEMPLATE = { id: 5, version_id: 1, version: 1, template_html: '<!doctype html><html><body><h1>Borrower terms</h1></body></html>' }

test.use({ storageState: { cookies: [], origins: [] } })

test('the sign modal opens and closes as the host requires or waives it, without a reload', async ({ page }) => {
  await page.addInitScript((u) => {
    window.localStorage.setItem('auth', JSON.stringify({ state: { token: 'e2e-fake-token', user: u, rememberMe: true }, version: 0 }))
    document.cookie = 'auth_session_active=true; path=/'
  }, USER)

  const ok = (route: Route, data: unknown) => route.fulfill({ json: { status: true, message: 'ok', data } })
  let required = false
  let flagged = false
  let refreshes = 0
  await page.route(`${API_ORIGIN}/**`, (route) => ok(route, []))
  // Only says something once flagged, as the catch-all does otherwise (the
  // page's subscription stays as the other mocked specs have it).
  await page.route(`${API_ORIGIN}/borrower/user-details`, (route) => ok(route, flagged ? { user: { ...USER, is_refresh: true } } : []))
  await page.route(`${API_ORIGIN}/common/refresh-user`, (route) => {
    refreshes += 1
    flagged = false
    return ok(route, USER)
  })
  const done = { is_complete: true, missing_fields: [] }
  await page.route(`${API_ORIGIN}/borrower/profile/completion`, (route) =>
    ok(route, { is_complete: true, personal: done, business: done, financial: done })
  )
  await page.route(`${API_ORIGIN}/borrower/agreement-sign/check`, (route) =>
    ok(route, required ? { needs_sign: true, template: TEMPLATE } : { needs_sign: false, template: null })
  )
  const goTo = (path: string) =>
    page.evaluate((p) => {
      window.history.pushState({}, '', p)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, path)
  const modal = page.getByRole('heading', { name: 'Agreement Signing' })

  const firstCheck = page.waitForResponse((r) => r.url().includes('/borrower/agreement-sign/check'))
  await page.goto('/payments')
  await firstCheck
  await expect(modal).toHaveCount(0)
  const refreshesAtStart = refreshes

  // The host requires it: the API flags the borrower.
  required = true
  flagged = true
  await goTo('/billing-details')
  await expect(modal).toBeVisible()
  expect(refreshes).toBe(refreshesAtStart + 1)

  // The host waives it again.
  required = false
  flagged = true
  await goTo('/payments')
  await expect(modal).toHaveCount(0)
  expect(refreshes).toBe(refreshesAtStart + 2)
})
