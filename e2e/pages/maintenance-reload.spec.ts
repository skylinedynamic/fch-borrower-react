import { test, expect, type Page, type Route } from '@playwright/test'
import { sidebarLink } from '../support/fixtures'

// Maintenance mode for a tab that is already open: the server's Nginx starts
// answering every API call with 503 { maintenance: true } and every portal page
// with its static maintenance page. The open tab reloads once and lands on that
// page. Every backend call is answered here, at the API origin, and the static
// page is stood in for at the portal origin, so no session, backend or Nginx is
// needed.
const API_ORIGIN = 'http://127.0.0.1:8000/api/v1'
const USER = { id: 1, name: 'Jane Borrower', email: 'jane@example.test', entity_type: 'borrower', entity_id: 1 }
const MAINTENANCE_MESSAGE = 'We are updating the platform. Please try again in a few minutes.'
const STATIC_PAGE = '<!doctype html><title>Maintenance</title><h1>We\'ll be right back</h1>'

test.use({ storageState: { cookies: [], origins: [] } })

const ok = (route: Route, data: unknown) => route.fulfill({ json: { status: true, message: 'ok', data } })

async function signIn(page: Page) {
  await page.addInitScript((u) => {
    window.localStorage.setItem('auth', JSON.stringify({ state: { token: 'e2e-fake-token', user: u, rememberMe: true }, version: 0 }))
    document.cookie = 'auth_session_active=true; path=/'
  }, USER)
  await page.route(`${API_ORIGIN}/**`, (route) => ok(route, []))
  await page.route(`${API_ORIGIN}/common/refresh-user`, (route) => ok(route, USER))
  await page.route(`${API_ORIGIN}/borrower/agreement-sign/check`, (route) => ok(route, { needs_sign: false, template: null }))
  await page.route(`${API_ORIGIN}/borrower/profile/completion`, (route) =>
    ok(route, {
      is_complete: true,
      personal: { is_complete: true, missing_fields: [] },
      business: { is_complete: true, missing_fields: [] },
      financial: { is_complete: true, missing_fields: [] },
    })
  )
}

/** The API side of the switch: every call answers the maintenance 503. */
async function apiInMaintenance(page: Page) {
  await page.unrouteAll({ behavior: 'ignoreErrors' })
  await page.route(`${API_ORIGIN}/**`, (route) =>
    route.fulfill({ status: 503, json: { status: false, maintenance: true, message: MAINTENANCE_MESSAGE } })
  )
}

/** The portal side of the switch: page loads get the static maintenance page. */
async function portalInMaintenance(page: Page, baseURL: string) {
  await page.route(`${new URL(baseURL).origin}/**`, (route) =>
    route.request().resourceType() === 'document'
      ? route.fulfill({ status: 503, contentType: 'text/html', body: STATIC_PAGE })
      : route.continue()
  )
}

/** Counts full page loads of the main frame from here on. */
function countPageLoads(page: Page) {
  const loads = { count: 0 }
  page.on('load', () => {
    loads.count += 1
  })
  return loads
}

test.describe('Maintenance in an open tab', () => {
  test('reloads onto the server maintenance page once maintenance starts', async ({ page, baseURL }) => {
    await signIn(page)
    await page.goto('/documents')
    await expect(sidebarLink(page, 'Invoices')).toBeVisible()

    await apiInMaintenance(page)
    await portalInMaintenance(page, baseURL!)
    await sidebarLink(page, 'Invoices').click()

    await expect(page.getByRole('heading', { name: "We'll be right back" })).toBeVisible()
  })

  test('reloads only once when the portal itself is still up, then shows the message', async ({ page }) => {
    await signIn(page)
    await page.goto('/documents')
    await expect(sidebarLink(page, 'Invoices')).toBeVisible()

    // Only the API reports maintenance; the portal page still loads normally.
    await apiInMaintenance(page)
    const loads = countPageLoads(page)
    await sidebarLink(page, 'Invoices').click()

    await expect(page.locator('.Toastify__toast', { hasText: MAINTENANCE_MESSAGE })).toBeVisible()
    // Give a second reload every chance to happen; it must not.
    await page.waitForTimeout(2000)
    expect(loads.count).toBe(1)
  })
})
