import { test, expect } from '../../support/fixtures'

// QA: a funding option blocked by the borrower's bank statements showed only
// "Missing Info". The detail page now says the bank statements failed and
// links to Documents to upload new ones.
//
// Whether a local borrower actually fails a banking check depends on the
// database, so the readiness-factors answer is replaced with the shape the API
// sends for a failed deposits check (see fch-backend-api
// FundingQualificationService::withBankingGuidance). Everything else is real.
const failedDeposits = {
  label: 'Minimum Monthly Deposits',
  status: 'Failed',
  group: 'banking',
  is_required_by_lender: true,
  borrower_value: 5000,
  required_value: 60000,
  message: 'Bank statements failed. Please upload proper bank statements.',
  action: { label: 'Upload Bank Statements', path: '/documents' },
}

test.describe('Sidebar › Funding › bank statements', () => {
  test.describe.configure({ timeout: 240_000 })

  test('a failed bank statement check says so and links to Documents', async ({ page }) => {
    await page.route('**/common/funding-qualification/*/readiness-factors', (route) =>
      route.fulfill({ json: { status: true, data: [failedDeposits] } })
    )

    await page.goto('/funding')
    const card = page.locator('.funding-card:not(.funding-card-disabled)').first()
    await expect(card).toBeVisible({ timeout: 60_000 })
    await card.click()
    await expect(page).toHaveURL(/\/funding\/\d+$/)

    const alert = page.getByRole('alert').filter({ hasText: 'Bank statements failed' })
    await expect(alert).toContainText('Bank statements failed. Please upload proper bank statements.')

    await alert.getByRole('link', { name: 'Upload Bank Statements' }).click()
    await expect(page).toHaveURL(/\/documents$/)
  })

  // QA: the hover card said "Banking Activity: Failed / Required: Uploaded",
  // then (first fix) said it twice. It now says once why and what to do.
  test('the card hover says once why Banking Activity failed and what is required', async ({ page }) => {
    const missingStatements = {
      label: 'Banking Activity',
      status: 'Failed',
      group: 'banking',
      borrower_value: 'Missing',
      required_value: 'Uploaded',
      reason_code: 'not_uploaded',
      reason: 'No Business Bank Statements uploaded yet.',
      requirement: 'Upload your Business Bank Statements on the Documents page.',
      message: 'Bank statements missing. Please upload your business bank statements.',
      action: { label: 'Upload Bank Statements', path: '/documents' },
    }
    let optionName = ''
    await page.route(/\/borrower\/funding(\?|$)/, async (route) => {
      const response = await route.fetch()
      const body = await response.json()
      const first = body.data.groups[0].sequencings[0]
      optionName = first.name
      first.readiness_factors = [missingStatements]
      first.engine_status = 'Active'
      first.latest_review_status = null
      await route.fulfill({ response, json: body })
    })

    await page.goto('/funding')
    await expect(page.locator('.funding-card').first()).toBeVisible({ timeout: 60_000 })
    await page.locator('.funding-card', { hasText: optionName }).first().hover()

    const tooltip = page.locator('.funding-missing-tooltip')
    await expect(tooltip).toContainText('Banking Activity: No Business Bank Statements uploaded yet.')
    await expect(tooltip).toContainText('Required: Upload your Business Bank Statements on the Documents page.')
    await expect(tooltip).not.toContainText('Required: Uploaded')
    await expect(tooltip).not.toContainText('Bank statements missing')
  })

  test('no bank statement message while the banking checks pass', async ({ page }) => {
    await page.route('**/common/funding-qualification/*/readiness-factors', (route) =>
      route.fulfill({ json: { status: true, data: [{ ...failedDeposits, status: 'Strong', message: undefined, action: undefined }] } })
    )

    await page.goto('/funding')
    const card = page.locator('.funding-card:not(.funding-card-disabled)').first()
    await expect(card).toBeVisible({ timeout: 60_000 })
    await card.click()
    await expect(page).toHaveURL(/\/funding\/\d+$/)
    await expect(page.locator('.breadcrumb').getByRole('link', { name: 'Funding Options' })).toBeVisible()

    await expect(page.getByText('Bank statements failed')).toHaveCount(0)
  })
})
