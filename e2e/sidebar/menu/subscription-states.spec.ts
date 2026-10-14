import type { Page } from '@playwright/test'
import { test, expect, sidebar, sidebarLink } from '../../support/fixtures'

// The sidebar for borrowers on other plans. The real /borrower/user-details
// (and /common/refresh-user) responses are fetched and only the subscription
// fields are overridden, so everything else stays live and nothing is written.
type Override = Record<string, unknown>

async function asSubscription(page: Page, override: Override) {
  for (const pattern of ['**/borrower/user-details', '**/common/refresh-user']) {
    await page.route(pattern, async (route) => {
      const response = await route.fetch()
      const json = await response.json()
      if (json?.data?.user) Object.assign(json.data.user, override)
      else if (json?.data) Object.assign(json.data, override)
      await route.fulfill({ response, json })
    })
  }
  // Login stored the real (paid host) snapshot; start from a neutral one so the
  // refreshed, overridden subscription is what the sidebar renders.
  await page.addInitScript((o) => {
    try {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}')
      if (auth?.state) {
        auth.state.userSubscription = { ...(auth.state.userSubscription || {}), ...o }
        if (auth.state.user) Object.assign(auth.state.user, o)
        localStorage.setItem('auth', JSON.stringify(auth))
      }
    } catch { /* keep storage */ }
  }, override)
  await page.goto('/')
  await expect(sidebar(page)).toBeVisible()
}

const locked = (page: Page, label: string) => sidebarLink(page, label).locator('.ri-lock-line')

const FREE_TRIAL_LOCKED = ['Capital Access', 'Invoices', 'Payments', 'Billing Details', 'Resource Hub']
const RESTRICTED_LOCKED = ['Pre Qualification', 'Funding Request', 'My Applications', 'Capital Access', 'Billing Details', 'Documents', 'Resource Hub', 'Appointment', 'Funding', 'Profile']

test.describe('Sidebar › subscription states', () => {
  // A refresh call can still be in flight when a test finishes; drop it quietly.
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })

  test('free trial: paid modules are locked and the Free Plan panel shows', async ({ page }) => {
    await asSubscription(page, { is_free_trail: true, is_host: false })

    for (const label of FREE_TRIAL_LOCKED) await expect(locked(page, label), label).toHaveCount(1)
    await expect(sidebar(page).getByRole('button', { name: /Credit Builder/ }).locator('.ri-lock-line')).toHaveCount(1)
    for (const label of ['Dashboard', 'Pre Qualification', 'Documents', 'Notification', 'Profile']) {
      await expect(locked(page, label), label).toHaveCount(0)
    }
    await expect(page.locator('.sidebar-trial-panel')).toContainText('Free Plan')
  })

  test('free trial: a locked item does not navigate and Credit Builder stays closed', async ({ page }) => {
    await asSubscription(page, { is_free_trail: true, is_host: false })

    await sidebarLink(page, 'Invoices').click()
    await expect(page).toHaveURL(/\/$/)

    const creditBuilder = sidebar(page).getByRole('button', { name: /Credit Builder/ })
    await creditBuilder.click()
    await expect(creditBuilder).toHaveAttribute('aria-expanded', 'false')
  })

  test('expired subscription (non-host): restricted modules are locked, Notification stays open', async ({ page }) => {
    await asSubscription(page, { is_host: false, is_free_trail: false, subscription_status: 'Expired' })

    for (const label of RESTRICTED_LOCKED) await expect(locked(page, label), label).toHaveCount(1)
    await expect(locked(page, 'Notification')).toHaveCount(0)
    await expect(locked(page, 'Dashboard')).toHaveCount(0)

    await sidebarLink(page, 'Documents').click()
    await expect(page).toHaveURL(/\/$/)

    await sidebarLink(page, 'Notification').click()
    await expect(page).toHaveURL(/\/notifications$/)
  })

  // E2E-012: hosts are exempt from subscription restrictions.
  test('expired subscription (host): nothing is locked', async ({ page }) => {
    await asSubscription(page, { is_host: true, is_free_trail: false, subscription_status: 'Expired' })

    await expect(sidebar(page).locator('.ri-lock-line')).toHaveCount(0)
    await sidebarLink(page, 'Documents').click()
    await expect(page).toHaveURL(/\/documents$/)
  })
})
