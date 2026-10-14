import type { Page } from '@playwright/test'
import { test, expect, pageHeading, expectOk } from '../../support/fixtures'

// Real create through the calendar, then delete it again so the calendar ends
// as it started.
async function pickFirst(_page: Page, dialog: ReturnType<Page['locator']>, placeholder: string, required = false) {
  // Only dropdowns still showing their placeholder; prefilled ones (e.g. the
  // default time slot) are left as they are.
  // PrimeReact exposes the dropdown trigger as a button named after the placeholder.
  const trigger = dialog.getByRole('button', { name: placeholder, exact: true })
  if (required) await expect(trigger).toBeVisible({ timeout: 60_000 }) // options load after the modal opens
  if (!(await trigger.count())) return
  await trigger.click()
  await dialog.locator('.p-dropdown-panel .p-dropdown-item, [role="listbox"] [role="option"]').filter({ hasNotText: placeholder }).first().click()
}

test.describe('Sidebar › Appointment (create / delete)', () => {
  test('creates an appointment on a future day and deletes it', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/appointment')
    await expect(pageHeading(page, 'Appointments')).toBeVisible()

    // A weekday ~10 days out, in month view (moving to next month if needed).
    const target = new Date()
    target.setDate(target.getDate() + 10)
    while ([0, 6].includes(target.getDay())) target.setDate(target.getDate() + 1)
    const iso = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`
    await page.getByRole('button', { name: 'Month', exact: true }).click()
    const cell = page.locator(`.fc-daygrid-day[data-date="${iso}"]`)
    if (!(await cell.count())) await page.locator('.fc-next-button').click()
    await cell.locator('.fc-daygrid-day-frame').click()

    const dialog = page.locator('.modal.show').first()
    await expect(dialog).toBeVisible()
    const title = `E2E appointment ${Date.now()}`
    await dialog.getByPlaceholder('Enter appointment title').fill(title)
    await pickFirst(page, dialog, 'Select Type', true)
    await pickFirst(page, dialog, 'Select Partner', true)
    await pickFirst(page, dialog, 'Start')
    await pickFirst(page, dialog, 'End')

    const create = page.waitForResponse((r) => r.request().method() === 'POST' && /\/common\/appointments$/.test(r.url()))
    await dialog.getByRole('button', { name: /Confirm Appointment/ }).click()
    const created = await create
    await expectOk(created)
    expect((await created.json()).status).toBe(true)
    await expect(page.locator('.Toastify__toast--success').first()).toBeVisible()

    // Open it from the calendar and delete it.
    await page.goto('/appointment')
    await page.getByRole('button', { name: 'List', exact: true }).click()
    if (!(await page.getByText(title).count())) await page.locator('.fc-next-button').click()
    await page.getByText(title).first().click()
    const details = page.locator('.modal.show').first()
    await expect(details).toContainText(title)

    const del = page.waitForResponse((r) => r.request().method() === 'DELETE' && /\/common\/appointments\/\d+$/.test(r.url()))
    await details.getByRole('button', { name: /Delete/i }).first().click()
    // "Are you sure?" confirmation.
    await page.getByRole('button', { name: 'Yes, Delete It' }).click()
    expect((await del).ok()).toBe(true)
    // The (now hidden) details modal still holds the title, so check the calendar itself.
    await expect(page.locator('.fc')).not.toContainText(title)
  })
})
