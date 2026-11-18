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

const FREE_TRIAL_LOCKED = ['Credit Card Stacking', 'Invoices', 'Payments', 'Billing Details', 'Resource Hub']
const RESTRICTED_LOCKED = ['Pre Qualification', 'Funding Request', 'My Applications', 'Credit Card Stacking', 'Documents', 'Resource Hub', 'Appointment', 'Funding']
// BUG-069: what they owe, how to resume, and their own profile stay open.
const RESTRICTED_OPEN = ['Dashboard', 'Invoices', 'Payments', 'Billing Details', 'Notifications', 'Profile']

test.describe('Sidebar › subscription states', () => {
  // A refresh call can still be in flight when a test finishes; drop it quietly.
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })

  test('free trial: paid modules are locked and the Free Plan panel shows', async ({ page }) => {
    await asSubscription(page, { is_free_trail: true, is_host: false })

    for (const label of FREE_TRIAL_LOCKED) await expect(locked(page, label), label).toHaveCount(1)
    await expect(sidebar(page).getByRole('button', { name: /Credit Builder/ }).locator('.ri-lock-line')).toHaveCount(1)
    for (const label of ['Dashboard', 'Pre Qualification', 'Documents', 'Notifications', 'Profile']) {
      await expect(locked(page, label), label).toHaveCount(0)
    }
    await expect(page.locator('.sidebar-trial-panel')).toContainText('Free Plan')
  })

  // R3-BUG-036: a free-plan lock explains itself, like the other locks (BUG-033).
  test('free trial: a locked item does not navigate, says why, and Credit Builder stays closed', async ({ page }) => {
    await asSubscription(page, { is_free_trail: true, is_host: false })

    await sidebarLink(page, 'Invoices').click()
    await expect(page).toHaveURL(/\/$/)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Not included in the Limited Free Plan')
    await expect(dialog.getByRole('link', { name: 'View Invoices' })).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Got it' }).click()
    await expect(dialog).toBeHidden()

    const creditBuilder = sidebar(page).getByRole('button', { name: /Credit Builder/ })
    await creditBuilder.click()
    await expect(creditBuilder).toHaveAttribute('aria-expanded', 'false')
    await expect(dialog).toContainText('Not included in the Limited Free Plan')
  })

  // R3-BUG-036: a billing notification's /invoices link, opened on the free plan.
  test('free trial: a locked page sends the client to the Dashboard and says why', async ({ page }) => {
    await asSubscription(page, { is_free_trail: true, is_host: false })

    await page.goto('/invoices')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('dialog').filter({ hasText: 'Not included in the Limited Free Plan' })).toBeVisible()
  })

  test('expired subscription (non-host): restricted modules are locked, Notification stays open', async ({ page }) => {
    await asSubscription(page, { is_host: false, is_free_trail: false, subscription_status: 'Expired' })

    for (const label of RESTRICTED_LOCKED) await expect(locked(page, label), label).toHaveCount(1)
    for (const label of RESTRICTED_OPEN) await expect(locked(page, label), label).toHaveCount(0)

    await sidebarLink(page, 'Documents').click()
    await expect(page).toHaveURL(/\/$/)
    // BUG-033: the locked item explains why.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Your subscription is not active')
    await dialog.getByRole('button', { name: 'Got it' }).click()
    await expect(dialog).toBeHidden()

    await sidebarLink(page, 'Notifications').click()
    await expect(page).toHaveURL(/\/notifications$/)
  })

  // BUG-033: a client whose enrollment is still being activated is told so -
  // on a locked menu, and when a locked page sends them back to the Dashboard.
  test('awaiting activation: a locked menu and a locked page explain why, without naming the partner', async ({ page }) => {
    await asSubscription(page, { is_host: false, is_free_trail: false, partner_type: 'White-Label Partner (WL)', partner_payment_for_me: false, subscription_status: 'Active' })

    await sidebarLink(page, 'Funding').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Your account is being activated')
    await expect(dialog).not.toContainText(/partner/i)
    await dialog.getByRole('button', { name: 'Got it' }).click()
    await expect(dialog).toBeHidden()

    await page.goto('/funding')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('dialog')).toContainText('Your account is being activated')
  })

  // E2E-012: hosts are exempt from subscription restrictions.
  // BUG-069: cancelling stops renewal, not access - nothing locks before the end date.
  test('cancelled subscription before its end date: nothing is locked', async ({ page }) => {
    const ahead = new Date()
    ahead.setDate(ahead.getDate() + 10)
    const endDate = `${ahead.getFullYear()}-${String(ahead.getMonth() + 1).padStart(2, '0')}-${String(ahead.getDate()).padStart(2, '0')}`
    await asSubscription(page, { is_host: false, is_free_trail: false, subscription_status: 'Cancelled', subscription_end_date: endDate })

    await expect(sidebar(page).locator('.ri-lock-line')).toHaveCount(0)
    await sidebarLink(page, 'Documents').click()
    await expect(page).toHaveURL(/\/documents$/)
  })

  test('expired subscription (host): nothing is locked', async ({ page }) => {
    await asSubscription(page, { is_host: true, is_free_trail: false, subscription_status: 'Expired' })

    await expect(sidebar(page).locator('.ri-lock-line')).toHaveCount(0)
    await sidebarLink(page, 'Documents').click()
    await expect(page).toHaveURL(/\/documents$/)
  })
})
