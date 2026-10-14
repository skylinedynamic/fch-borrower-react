import { test as base, expect, type Page } from '@playwright/test'

// Records uncaught page errors and 5xx API responses for the whole test, and
// fails the test if any happened. 4xx is left alone: several pages probe
// endpoints that legitimately answer 404/403 for this borrower.
export const test = base.extend<{ runtimeErrors: string[] }>({
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
