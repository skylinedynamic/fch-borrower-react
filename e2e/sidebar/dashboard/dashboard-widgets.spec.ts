import { test, expect, pageHeading } from '../../support/fixtures'

// Every action button on the dashboard cards leads where it says.
test.describe('Sidebar › Dashboard › widget actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(pageHeading(page, /^Welcome back,/)).toBeVisible()
  })

  const button = (page: import('@playwright/test').Page, name: string | RegExp) =>
    page.locator('.page-content').getByRole('button', { name }).first()

  test('the strategy button opens Credit Card Stacking, unless a payment comes first', async ({ page }) => {
    const strategy = button(page, /Resume Strategy|Choose Strategy/)
    // With an invoice to pay (or no active subscription) the payment is the way
    // forward, so the hero offers no strategy to start.
    if (await page.locator('.page-content .db-alert').isVisible()) {
      await expect(strategy).toHaveCount(0)
      return
    }
    await strategy.click()
    await expect(page).toHaveURL(/\/credit-card-stacking$/)
  })

  test('both "View All" buttons open My Applications', async ({ page }) => {
    const viewAll = page.locator('.page-content').getByRole('button', { name: 'View All', exact: true })
    await expect(viewAll).toHaveCount(2)
    for (const i of [0, 1]) {
      await page.goto('/')
      await page.locator('.page-content').getByRole('button', { name: 'View All', exact: true }).nth(i).click()
      await expect(page).toHaveURL(/\/my-applications$/)
    }
  })

  test('"Schedule Meeting" opens Appointments', async ({ page }) => {
    await button(page, 'Schedule Meeting').click()
    await expect(page).toHaveURL(/\/appointment$/)
  })

  test('"View All Invoices" opens Invoices', async ({ page }) => {
    const card = page.locator('.page-content [data-widget="invoices"]')
    test.skip((await card.count()) === 0, 'No invoices card for this borrower')
    await card.getByRole('button', { name: 'View All Invoices' }).click()
    await expect(page).toHaveURL(/\/invoices$/)
  })

  test('Schedule Meeting and View All Invoices sit level, at the foot of their cards', async ({ page }) => {
    const invoices = page.locator('.page-content [data-widget="invoices"]')
    test.skip((await invoices.count()) === 0, 'No invoices card for this borrower')
    const meetings = page.locator('.page-content [data-widget="meetings"]')
    const schedule = (await meetings.getByRole('button', { name: /schedule meeting/i }).boundingBox())!
    const viewAll = (await invoices.getByRole('button', { name: 'View All Invoices' }).boundingBox())!
    expect(Math.round(schedule.y)).toBe(Math.round(viewAll.y))
    // Each one ends where its card's body padding ends.
    for (const [card, button] of [[meetings, schedule], [invoices, viewAll]] as const) {
      const box = (await card.boundingBox())!
      expect(Math.round(box.y + box.height - (button.y + button.height))).toBeLessThanOrEqual(24)
    }
  })

  // Rows open their details from anywhere on the row, not just the link text:
  // each test clicks the row near its right-hand end, well away from the link.
  const clickRowEnd = async (row: import('@playwright/test').Locator) => {
    const box = (await row.boundingBox())!
    await row.click({ position: { x: box.width - 24, y: box.height / 2 } })
  }

  test('an invoice row opens that invoice', async ({ page }) => {
    const row = page.locator('.page-content [data-widget="invoices"] .db-invoice').first()
    test.skip((await row.count()) === 0, 'No invoices for this borrower')
    const href = await row.getByRole('link').getAttribute('href')
    await clickRowEnd(row)
    await expect(page).toHaveURL(new RegExp(`${href}$`))
  })

  test('a funding application row opens its details page', async ({ page }) => {
    const row = page.locator('.page-content [data-widget="funding-applications"] tbody tr.is-clickable').first()
    test.skip((await row.count()) === 0, 'No funding applications for this borrower')
    await clickRowEnd(row)
    await expect(page).toHaveURL(/\/my-applications\/funding\/\d+$/)
  })

  test("a pre-qualification row opens its details, as on My Applications", async ({ page }) => {
    const row = page.locator('.page-content [data-widget="pre-qualifications"] tbody tr.is-clickable').first()
    test.skip((await row.count()) === 0, 'No pre-qualifications for this borrower')
    await clickRowEnd(row)
    const dialog = page.getByRole('dialog').filter({ hasText: 'Pre-Qualification Details' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Close' }).last().click()
    await expect(dialog).toBeHidden()
  })

  test('"Make an Appointment" opens Appointments', async ({ page }) => {
    await expect(button(page, /Contact Support/)).toHaveCount(0)
    await button(page, 'Make an Appointment').click()
    await expect(page).toHaveURL(/\/appointment$/)
  })

  test('shows the credit score, tier and meetings cards', async ({ page }) => {
    const content = page.locator('.page-content')
    await expect(content.getByRole('heading', { name: 'Credit Score', exact: true })).toBeVisible()
    await expect(content.getByText('Current Tier Status')).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Upcoming Meetings', exact: true })).toBeVisible()
  })
})
