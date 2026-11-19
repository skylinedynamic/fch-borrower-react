import type { Page, Route } from '@playwright/test'
import { test, expect, pageHeading } from '../../support/fixtures'

/**
 * The borrower's Calendly card on Appointment, against the real login and
 * appointments API. Only Calendly's own endpoints are stubbed: there is no
 * Calendly account behind the local backend, and this changes no data.
 *
 * The scenarios: a borrower booking with their advisor's Calendly (no Calendly of
 * their own) may Pull but not Push; one with their own may do all three and
 * disconnect; one whose advisor has no Calendly sees no card.
 */
type Call = { method: string; path: string; json: any }

const withPartner = {
  configured: true, connected: false, needs_reconnect: false, can_manage: true, can_sync: true,
  is_host: false, can_book: true, books_with_partner: true, partner_connected: true,
  partner_name: 'Acme Advisors', name: null, email: null, scheduling_url: 'https://calendly.com/acme',
  connected_by: null, webhooks_active: false, last_synced_at: null,
}
const ownConnected = {
  ...withPartner, connected: true, is_host: true, books_with_partner: false,
  name: 'Craig Borrower', email: 'craig@example.test', webhooks_active: true,
}

async function stubCalendly(page: Page, status: Record<string, unknown>, sync?: Record<string, unknown>): Promise<Call[]> {
  const calls: Call[] = []
  await page.route('**/api/v1/common/calendly/**', async (route: Route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname
    let json: any = null
    try { json = req.postDataJSON() } catch { /* no body */ }
    calls.push({ method: req.method(), path, json })

    if (path.endsWith('/calendly/status')) return route.fulfill({ json: { status: true, data: status } })
    if (path.endsWith('/calendly/sync')) {
      return route.fulfill({ json: { status: true, data: sync ?? { direction: json?.direction, from: json?.from, to: json?.to, pulled: 2, pushed: 0, failed: 0, errors: [] } } })
    }
    if (path.endsWith('/calendly/connect')) return route.fulfill({ json: { status: true, data: { url: '/appointment?calendly=connected' } } })
    if (path.endsWith('/calendly/connection')) return route.fulfill({ json: { status: true, data: null } })
    return route.fulfill({ json: { status: true, data: [] } })
  })
  return calls
}

async function openAppointment(page: Page) {
  await page.goto('/appointment')
  await expect(pageHeading(page, 'Appointments')).toBeVisible()
  await expect(page.locator('.fc')).toBeVisible()
}

const card = (page: Page) => page.locator('.calendly-card')
const syncModal = (page: Page) => page.locator('.modal.show').filter({ hasText: 'Sync with Calendly' })

test.describe('Sidebar › Appointment › Calendly', () => {
  test('booking with the advisor\'s Calendly: says so, offers Connect and Sync now', async ({ page }) => {
    await stubCalendly(page, withPartner)
    await openAppointment(page)

    await expect(card(page).getByText(/You book with your advisor.s Calendly/)).toBeVisible()
    await expect(card(page).getByText('Acme Advisors')).toBeVisible()
    await expect(card(page).getByRole('button', { name: 'Connect Calendly' })).toBeVisible()
    await expect(card(page).getByRole('button', { name: 'Sync now' })).toBeVisible()
    await expect(card(page).getByRole('button', { name: 'Disconnect' })).toHaveCount(0)
  })

  test('without their own Calendly: Pull only - Push and Two-way are off and say why', async ({ page }) => {
    const calls = await stubCalendly(page, withPartner)
    await openAppointment(page)

    await card(page).getByRole('button', { name: 'Sync now' }).click()
    const dialog = syncModal(page)
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('radio', { name: 'Pull from Calendly' })).toBeChecked()
    await expect(dialog.getByRole('radio', { name: 'Push to Calendly' })).toBeDisabled()
    await expect(dialog.getByRole('radio', { name: 'Two-way sync' })).toBeDisabled()
    await expect(dialog.getByText('Connect your own Calendly to send your meetings to it.').first()).toBeVisible()

    await dialog.getByRole('button', { name: 'Sync', exact: true }).click()

    await expect.poll(() => calls.filter((c) => c.method === 'POST' && c.path.endsWith('/calendly/sync')).length).toBe(1)
    const sync = calls.find((c) => c.path.endsWith('/calendly/sync'))!
    expect(sync.json.direction).toBe('pull')
    expect(sync.json.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    await expect(page.getByText(/2 brought in from Calendly/)).toBeVisible()
  })

  test('with their own Calendly: Two-way is allowed and sent', async ({ page }) => {
    const calls = await stubCalendly(page, ownConnected, { direction: 'both', from: '2026-11-01', to: '2026-11-30', pulled: 1, pushed: 1, failed: 0, errors: [] })
    await openAppointment(page)

    await expect(card(page).getByText('Connected', { exact: true })).toBeVisible()
    await expect(card(page).getByText('Craig Borrower · craig@example.test')).toBeVisible()

    await card(page).getByRole('button', { name: 'Sync now' }).click()
    const dialog = syncModal(page)
    await expect(dialog.getByRole('radio', { name: 'Push to Calendly' })).toBeEnabled()
    await dialog.getByText('Two-way sync').click()
    await dialog.getByRole('button', { name: 'Sync', exact: true }).click()

    await expect.poll(() => calls.find((c) => c.path.endsWith('/calendly/sync'))?.json?.direction).toBe('both')
    await expect(page.getByText(/1 brought in from Calendly, 1 sent to Calendly/)).toBeVisible()
  })

  test('Connect Calendly starts the sign-in and comes back connected', async ({ page }) => {
    const calls = await stubCalendly(page, withPartner)
    await openAppointment(page)

    await card(page).getByRole('button', { name: 'Connect Calendly' }).click()

    await expect.poll(() => calls.some((c) => c.method === 'POST' && c.path.endsWith('/calendly/connect'))).toBe(true)
    await expect(page.getByText('Calendly connected')).toBeVisible()
    await expect(page).not.toHaveURL(/calendly=/)
  })

  test('Disconnect asks first, then removes only their own connection', async ({ page }) => {
    const calls = await stubCalendly(page, ownConnected)
    await openAppointment(page)

    await card(page).getByRole('button', { name: 'Disconnect' }).click()
    await expect(page.getByText('Disconnect Calendly?')).toBeVisible()
    await page.getByRole('button', { name: 'Yes, disconnect' }).click()

    await expect.poll(() => calls.some((c) => c.method === 'DELETE' && c.path.endsWith('/calendly/connection'))).toBe(true)
    await expect(page.getByText('Calendly disconnected')).toBeVisible()
  })

  test('the advisor has no Calendly and no app keys: no card at all', async ({ page }) => {
    await stubCalendly(page, { ...withPartner, configured: false, can_manage: false, can_sync: false, can_book: false, books_with_partner: false, partner_connected: false, partner_name: null })
    await openAppointment(page)

    await expect(card(page)).toHaveCount(0)
  })
})
