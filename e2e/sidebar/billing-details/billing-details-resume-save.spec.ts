import { test, expect, openFromSidebar } from '../../support/fixtures'
import { API_BASE_URL, BORROWER_PASSWORD, SLOW_TIMEOUT } from '../../support/env'
import { runSeeder } from '../../support/backend'
import type { APIRequestContext, Page } from '@playwright/test'

// BUG-069: cancelling stops renewal, not access - the borrower keeps every
// page until the end date, and can resume from Billing Details.
//
// Writes data, on its own account: E2EInstallmentBorrowerSeeder (fch-api)
// sets up a borrower on an installment plan whose period is still running,
// and puts it back the same on every run. The spec cancels, checks the pages
// still open after the stored status is reloaded (as on the next login, where
// the lockout appeared), then resumes - before the end date that is active
// again at once, with no invoice raised.

const INSTALLMENT_BORROWER = process.env.E2E_INSTALLMENT_BORROWER_EMAIL || 'e2e-installment-borrower@fourcornerholdings.test'

// Its own login, not the shared borrower's saved session.
test.use({ storageState: { cookies: [], origins: [] } })

async function token(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('auth')
    return raw ? JSON.parse(raw)?.state?.token ?? null : null
  })
}

async function subscriptionStatus(page: Page, request: APIRequestContext) {
  const res = await request.get(`${API_BASE_URL}/borrower/billing-details`, {
    headers: { Authorization: `Bearer ${await token(page)}`, Accept: 'application/json' },
  })
  return res.ok() ? (await res.json())?.data?.subscription?.status : null
}

test.describe('Sidebar › Billing Details › cancel and resume', () => {
  const login = async (page: Page) => {
    await page.goto('/login')
    await page.getByLabel(/^Email/i).fill(INSTALLMENT_BORROWER)
    await page.getByLabel(/^Password/i).fill(BORROWER_PASSWORD)
    await page.getByRole('button', { name: /Sign In/i }).click()
    await expect(page.locator('#navbar-nav')).toBeVisible({ timeout: SLOW_TIMEOUT })
  }

  /** Puts the account back: Active, period running, nothing open. */
  const seedRunning = () => runSeeder('E2EInstallmentBorrowerSeeder')

  /** Cancelled, its end date past: the portal is locked down. */
  const seedEnded = () => {
    process.env.E2E_INSTALLMENT_ENDED = '1'
    try {
      runSeeder('E2EInstallmentBorrowerSeeder')
    } finally {
      delete process.env.E2E_INSTALLMENT_ENDED
    }
  }

  test.afterEach(() => {
    seedRunning()
  })

  test('a cancelled borrower keeps every page until the end date, then resumes', async ({ page, request }) => {
    test.setTimeout(240_000)
    seedRunning()
    await login(page)

    await openFromSidebar(page, 'Billing Details', /\/billing-details$/)
    const cancel = page.getByRole('button', { name: /cancel subscription/i }).first()
    const resume = page.getByRole('button', { name: /resume subscription/i })
    await expect(cancel).toBeVisible({ timeout: 60_000 })

    await cancel.click()
    await page.locator('.modal.show').getByRole('button', { name: 'Yes, Cancel Subscription' }).click()
    await expect(resume).toBeVisible({ timeout: 60_000 })
    expect(await subscriptionStatus(page, request)).toBe('Cancelled')

    // The app reloads the stored subscription on start, as on the next login.
    await page.reload()
    await expect(page.locator('#navbar-nav')).toBeVisible({ timeout: SLOW_TIMEOUT })
    await page.waitForFunction(
      () => JSON.parse(localStorage.getItem('auth') || '{}')?.state?.userSubscription?.subscription_status === 'Cancelled',
      undefined,
      { timeout: SLOW_TIMEOUT }
    )
    for (const path of ['/documents', '/profile', '/appointment']) {
      await page.goto(path)
      await page.waitForTimeout(1_000)
      await expect(page).toHaveURL(new RegExp(`${path}$`))
    }

    await openFromSidebar(page, 'Billing Details', /\/billing-details$/)
    await expect(resume).toBeVisible({ timeout: 60_000 })
    await resume.click()
    await page.locator('.modal.show').getByRole('button', { name: 'Yes, Resume' }).click()

    await expect(page.locator('.Toastify__toast').filter({ hasText: 'Your subscription is active again.' })).toBeVisible({ timeout: 60_000 })
    // The bell says so too (borrower.subscription.reactivated, over the socket).
    await expect(page.locator('.notif-item__body').filter({ hasText: 'Your subscription is active again.' }).first()).toBeAttached({ timeout: 60_000 })
    await expect(cancel).toBeVisible({ timeout: 60_000 })
    expect(await subscriptionStatus(page, request)).toBe('Active')
  })

  test('after the end date, Resume takes the borrower to the invoice, which warns it reactivates', async ({ page }) => {
    test.setTimeout(240_000)
    seedEnded()
    await login(page)

    // Locked down, but Billing Details and Profile stay open.
    await page.goto('/documents')
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: SLOW_TIMEOUT })
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/profile$/)

    await openFromSidebar(page, 'Billing Details', /\/billing-details$/)
    await page.getByRole('button', { name: /resume subscription/i }).click()
    await page.locator('.modal.show').getByRole('button', { name: 'Yes, Resume' }).click()

    await expect(page).toHaveURL(/\/invoices\/\d+$/, { timeout: 60_000 })
    await page.getByRole('button', { name: /pay now/i }).first().click()
    await expect(page.getByRole('alert').filter({ hasText: 'Paying this invoice will reactivate it' })).toBeVisible({ timeout: 60_000 })
  })
})
