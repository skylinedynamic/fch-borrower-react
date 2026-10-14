import { test, expect, openFromSidebar, pageHeading } from '../../support/fixtures'

test.describe('Sidebar › Appointment', () => {
  test.beforeEach(async ({ page }) => {
    await openFromSidebar(page, 'Appointment', /\/appointment$/)
  })

  test('shows the calendar and the upcoming appointment panel', async ({ page }) => {
    await expect(pageHeading(page, 'Appointments')).toBeVisible()
    await expect(pageHeading(page, 'Upcoming Appointment')).toBeVisible()
    await expect(page.locator('.fc')).toBeVisible()
  })

  test('switches between Month, Week, Day and List views', async ({ page }) => {
    for (const [view, cls] of [['Week', /fc-timeGridWeek-view/], ['Day', /fc-timeGridDay-view/], ['List', /fc-list/], ['Month', /fc-dayGridMonth-view/]] as const) {
      await page.getByRole('button', { name: view, exact: true }).click()
      await expect(page.locator('.fc-view-harness .fc-view').first()).toHaveClass(cls)
    }
  })

  test('"Create New Appointment" opens the form and Cancel closes it', async ({ page }) => {
    await page.getByRole('button', { name: /Create New Appointment/ }).click()
    const modal = page.locator('.modal.show, [role="dialog"]').first()
    await expect(modal).toBeVisible()
    await modal.getByRole('button', { name: /Cancel|Close/i }).first().click()
    await expect(modal).toBeHidden()
  })
})
