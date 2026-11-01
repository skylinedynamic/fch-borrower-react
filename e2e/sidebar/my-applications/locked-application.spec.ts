import type { Page } from '@playwright/test'
import { test, expect, pageHeading } from '../../support/fixtures'

// SCRUM-331: a funding application whose status isn't in the API's editable
// list tells the borrower it can't be edited and why - on the details page,
// and on the edit form if its URL is opened directly. Only the application
// answers are replaced; the session and the rest of the page are real.

const reasonFor = (status: string) =>
  `This application can no longer be edited because it is "${status}". Contact your funding advisor if something needs to change.`

const applicationAt = (status: string) => ({
  id: 999000,
  application_number: 'FUND-999000',
  status,
  funding_request_id: 999001,
  funding_request_status: 'Approved',
  is_editable: false,
  locked_reason: reasonFor(status),
  full_name: 'Michael Chen',
  business_name: 'Alpha Tech Solutions',
  co_borrowers: [],
  documents: [],
})

async function serveLockedDetails(page: Page, status: string) {
  await page.route('**/api/v1/common/request-application/funding-application/999000', (route) =>
    route.fulfill({ json: { status: true, message: 'ok', data: applicationAt(status) } })
  )
}

test.describe('Sidebar › My Applications › locked application', () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })

  for (const status of ['Matched to Lender', 'Funded', 'Withdrawn', 'Closed - Error']) {
    test(`the details page says it can't be edited at ${status}`, async ({ page }) => {
      await serveLockedDetails(page, status)

      await page.goto('/my-applications/funding/999000')
      await expect(pageHeading(page, 'Funding Application Details')).toBeVisible()

      await expect(page.getByRole('link', { name: /edit application/i })).toHaveCount(0)
      await expect(page.getByRole('button', { name: /can't edit application/i })).toBeDisabled()
      await expect(page.getByRole('status').filter({ hasText: reasonFor(status) })).toBeVisible()
    })
  }

  test('the edit form opened on a locked application shows why instead of the form', async ({ page }) => {
    await page.route('**/api/v1/borrower/funding-application/funding-request?*', (route) =>
      route.fulfill({
        json: {
          status: true,
          message: 'ok',
          data: { id: 999000, funding_request_id: 999001, status: 'Withdrawn', is_editable: false, is_locked: true, locked_reason: reasonFor('Withdrawn') },
        },
      })
    )

    await page.goto('/fund-application/999001')

    await expect(page.getByRole('heading', { name: "Can't Edit Funding Application" })).toBeVisible()
    await expect(page.getByText(reasonFor('Withdrawn'))).toBeVisible()
    await expect(page.getByText(/Step \d+ of \d+:/).filter({ visible: true })).toHaveCount(0)
  })
})
