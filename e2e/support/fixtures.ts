import { test as base, expect, type Page } from '@playwright/test'
import { API_BASE_URL } from './env'

// The key the portal remembers the step whose Getting Started popup it already
// opened this session under (src/modules/onboarding/storage.ts).
const ONBOARDING_SESSION_KEY = 'fch:onboarding:session-step:'

// Records uncaught page errors and 5xx API responses for the whole test, and
// fails the test if any happened. 4xx is left alone: several pages probe
// endpoints that legitimately answer 404/403 for this borrower.
export const test = base.extend<{ runtimeErrors: string[]; dismissGettingStarted: void }>({
  // The Getting Started popup opens by itself once per step per login, on
  // whatever page the borrower is on, and covers it mid-test. Each spec starts
  // as if it had been shown already for the borrower's current step, so it
  // stays closed; if it opens anyway (the step moved on), it is put off
  // ("Later"). Its own spec (topbar/getting-started) doesn't use these fixtures.
  dismissGettingStarted: [
    async ({ page, request }, use) => {
      const state = await page.context().storageState()
      const auth = state.origins.flatMap((o) => o.localStorage).find((item) => item.name === 'auth')
      const { token, user } = auth ? (JSON.parse(auth.value).state ?? {}) : {}
      if (token && user?.id != null) {
        const res = await request.get(`${API_BASE_URL}/borrower/profile/completion`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
        const step = res.ok() ? (await res.json())?.data?.onboarding?.current_step : null
        if (step) {
          await page.addInitScript(([key, value]) => sessionStorage.setItem(key, value), [`${ONBOARDING_SESSION_KEY}${user.id}`, step])
        }
      }

      const popup = page.getByRole('dialog').filter({ hasText: /Getting started · Step/ })
      await page.addLocatorHandler(popup, async () => {
        await popup.getByRole('button', { name: 'Later' }).click()
      })
      await use()
    },
    { auto: true },
  ],
  runtimeErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      // Include where it was thrown, so a failure names the script responsible.
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.message} @ ${(err.stack || '').split('\n').find((l) => l.trim().startsWith('at')) ?? '?'}`))
      page.on('response', (res) => {
        if (res.status() >= 500 && res.url().includes('/api/')) {
          errors.push(`${res.status()} ${res.request().method()} ${res.url()}`)
        }
      })
      await use(errors)
      expect(errors, 'uncaught page errors / 5xx API responses').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

export const sidebar = (page: Page) => page.locator('#navbar-nav')

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// A sidebar link, matched by its whole visible label so "Funding" does not
// also match "Funding Request". A trailing badge count is allowed.
export const sidebarLink = (page: Page, label: string | RegExp) =>
  sidebar(page)
    .locator('a.menu-link, a.subitem')
    .filter({ hasText: typeof label === 'string' ? new RegExp(`^\\s*${escapeRegExp(label)}\\s*\\d*\\+?\\s*$`) : label })

// Real rows of the PrimeReact table. While loading, DataTableWrapper renders
// TableLoader - itself a PrimeReact table full of .skeleton-line cells - so a
// plain row locator can match (and click) a placeholder.
export const dataRows = (page: Page) =>
  page
    .locator('.page-content .p-datatable-tbody > tr')
    .filter({ hasNot: page.locator('.p-datatable-emptymessage') })
    .filter({ hasNot: page.locator('.skeleton-line') })

export const emptyTableMessage = (page: Page) => page.locator('.page-content .p-datatable-emptymessage')

// Opens the portal on the dashboard and navigates by clicking the sidebar
// menu item, like a real user, then checks the URL and the active highlight.
export async function openFromSidebar(page: Page, label: string | RegExp, url: RegExp) {
  await page.goto('/')
  await expect(sidebar(page)).toBeVisible()
  const link = sidebarLink(page, label).first()
  await link.click()
  await expect(page).toHaveURL(url)
  await expect(link).toHaveClass(/active/)
}

// The page heading every sidebar screen renders inside .page-content.
export const pageHeading = (page: Page, name: string | RegExp) =>
  page.locator('.page-content').getByRole('heading', { name }).first()

// Fails with the status, URL and body of a non-2xx response. The body is read
// only on failure: after a success the page often navigates away, and Chrome
// then no longer has the body to give back.
export async function expectOk(res: import('@playwright/test').Response) {
  if (!res.ok()) {
    const body = await res.text().catch(() => '<body no longer available>')
    throw new Error(`${res.status()} ${res.request().method()} ${res.url()}: ${body}`)
  }
}
