import { test, expect, type Page, type Route } from '@playwright/test'

// The Complete Your Profile popup: a borrower with gaps in their profile gets
// it on every page but Profile, and can't dismiss it - no close or cancel
// button, no Escape - only pick a section to complete. Every backend call is
// answered here, at the API origin, so no session or backend is needed. Pages
// open on /payments, which renders with the empty data every other call gets.
const API_ORIGIN = 'http://127.0.0.1:8000/api/v1'
const USER = { id: 1, name: 'Jane Borrower', email: 'jane@example.test', entity_type: 'borrower', entity_id: 1 }

test.use({ storageState: { cookies: [], origins: [] } })

async function signInWithIncompleteProfile(page: Page) {
  await page.addInitScript((u) => {
    window.localStorage.setItem('auth', JSON.stringify({ state: { token: 'e2e-fake-token', user: u, rememberMe: true }, version: 0 }))
    document.cookie = 'auth_session_active=true; path=/'
  }, USER)

  const ok = (route: Route, data: unknown) => route.fulfill({ json: { status: true, message: 'ok', data } })
  await page.route(`${API_ORIGIN}/**`, (route) => ok(route, []))
  await page.route(`${API_ORIGIN}/common/refresh-user`, (route) => ok(route, USER))
  await page.route(`${API_ORIGIN}/borrower/agreement-sign/check`, (route) => ok(route, { needs_sign: false, template: null }))
  await page.route(`${API_ORIGIN}/borrower/profile/completion`, (route) =>
    ok(route, {
      is_complete: false,
      personal: { is_complete: true, missing_fields: [] },
      business: { is_complete: false, missing_fields: ['business_email', 'business_country'] },
      financial: { is_complete: true, missing_fields: [] },
    })
  )
}

const modal = (page: Page) => page.locator('#profileCompleteModal')

test.describe('Complete Your Profile popup', () => {
  test('has no close or cancel button, and Escape leaves it open', async ({ page }) => {
    await signInWithIncompleteProfile(page)
    await page.goto('/payments')

    await expect(modal(page)).toBeVisible()
    await expect(modal(page)).toContainText('Complete Your Profile')
    await expect(modal(page).locator('.btn-close')).toHaveCount(0)
    await expect(modal(page).getByRole('button', { name: /close|cancel/i })).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(modal(page)).toBeVisible()
  })

  test('picking a section opens it on the Profile page', async ({ page }) => {
    await signInWithIncompleteProfile(page)
    await page.goto('/payments')

    await modal(page).getByText('Business Details').click()

    await expect(page).toHaveURL(/\/profile\?tab=1$/)
  })
})
