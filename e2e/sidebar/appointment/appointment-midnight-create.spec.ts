import type { Locator, Page } from '@playwright/test'
import { test, expect, pageHeading, expectOk } from '../../support/fixtures'
import { API_BASE_URL } from '../../support/env'

// Round 2 BUG-024: an appointment starting at 11:30 PM had an empty end list,
// saved as 0 minutes and the API's 422 was shown nowhere. Now it ends at
// 12:00 AM the next day and books 30 minutes. The appointment is deleted again.

const pad = (n: number) => String(n).padStart(2, '0')

async function pick(page: Page, dropdown: Locator, option: string | RegExp) {
  await dropdown.click()
  await page.locator('.p-dropdown-panel .p-dropdown-item').filter({ hasText: option }).first().click()
}

test.describe('Sidebar › Appointment (ending after midnight)', () => {
  test('an 11:30 PM appointment ends at 12:00 AM the next day and books 30 minutes', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/appointment')
    await expect(pageHeading(page, 'Appointments')).toBeVisible()

    // A day ~11 days out, in month view (moving to next month if needed).
    const target = new Date()
    target.setDate(target.getDate() + 11)
    const iso = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`
    await page.getByRole('button', { name: 'Month', exact: true }).click()
    const cell = page.locator(`.fc-daygrid-day[data-date="${iso}"]`)
    if (!(await cell.count())) await page.locator('.fc-next-button').click()
    await cell.locator('.fc-daygrid-day-frame').click()

    const dialog = page.locator('.modal.show').first()
    await expect(dialog).toBeVisible()
    await dialog.getByPlaceholder('Enter appointment title').fill(`E2E midnight ${Date.now()}`)
    const partner = dialog.getByRole('button', { name: 'Select Partner', exact: true })
    await expect(partner).toBeVisible({ timeout: 60_000 }) // options load after the modal opens
    await partner.click()
    await dialog.locator('.p-dropdown-panel .p-dropdown-item').filter({ hasNotText: 'Select Partner' }).first().click()

    const slots = dialog.locator('.time-slot-container .p-dropdown')
    await pick(page, slots.first(), /^11:30 PM$/)
    await expect(slots.nth(1).locator('.p-dropdown-label')).toHaveText('12:00 AM (next day)')

    const create = page.waitForResponse((r) => r.request().method() === 'POST' && /\/common\/appointments$/.test(r.url()))
    await dialog.getByRole('button', { name: /Confirm Appointment/ }).click()
    const created = await create
    expect(created.request().postDataJSON()).toMatchObject({ appointment_date: `${iso} 23:30:00`, duration_minutes: 30 })
    await expectOk(created)
    const id = (await created.json()).data?.id
    expect(id).toBeTruthy()

    try {
      await expect(page.locator('.Toastify__toast--success').first()).toBeVisible()
    } finally {
      const token = await page.evaluate(() => JSON.parse(localStorage.getItem('auth') || '{}').state?.token as string)
      await page.request.delete(`${API_BASE_URL}/common/appointments/${id}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
    }
  })
})
