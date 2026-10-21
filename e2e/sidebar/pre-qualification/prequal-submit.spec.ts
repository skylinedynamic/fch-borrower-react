import type { Page } from '@playwright/test'
import { test, expect, pageHeading, expectOk } from '../../support/fixtures'

// Real pre-qualification: save each step, submit, and wait for the
// underwriting result. The backend runs the OpenAI pre-qualification agent on
// submit (real API call, approved for this suite), so this is slow.

// Every CustomDropdown still showing its placeholder gets its first option.
async function fillEmptyDropdowns(page: Page) {
  const step = page.locator('.page-content .step-content')
  const empty = step.locator('.dropdown .form-select:has(span.text-muted)').filter({ visible: true })
  for (let i = 0; i < 12 && (await empty.count()) > 0; i++) {
    await empty.first().click()
    const options = page.locator('.dropdown.is-open .list-group-item-action').filter({ hasNotText: /^Other$/i })
    await options.first().click()
  }
}

async function fillEmptyInputs(page: Page, values: Record<string, string>) {
  for (const [placeholder, value] of Object.entries(values)) {
    // Desktop and mobile layouts both render the step; use the visible copy.
    const input = page.locator('.page-content .step-content').getByPlaceholder(placeholder).filter({ visible: true }).first()
    if ((await input.count()) && (await input.isEditable()) && !(await input.inputValue())) await input.fill(value)
  }
}

async function nextStep(page: Page, urlPart: RegExp) {
  const save = page.waitForResponse((r) => r.request().method() !== 'GET' && urlPart.test(r.url()), { timeout: 90_000 })
  await page.locator('.page-content .step-content').getByRole('button', { name: /Next Step/ }).filter({ visible: true }).first().click()
  const res = await save
  await expectOk(res)
}

test.describe('Sidebar › Pre Qualification (submit)', () => {
  test('saves every step, submits, and shows the underwriting result', async ({ page }) => {
    test.setTimeout(600_000)
    await page.goto('/pre-qualification')
    await expect(pageHeading(page, /Prequalify to Build Your Business Credit/)).toBeVisible()

    await expect(pageHeading(page, 'Personal Info')).toBeVisible()
    await fillEmptyDropdowns(page)
    await nextStep(page, /pre-?qualification|prequal/i)

    await expect(pageHeading(page, 'Business Details')).toBeVisible()
    await fillEmptyDropdowns(page)
    await nextStep(page, /pre-?qualification|prequal/i)

    await expect(pageHeading(page, 'Funding Needs')).toBeVisible()
    await fillEmptyInputs(page, { '25,000': '25000' })
    await fillEmptyDropdowns(page)
    await nextStep(page, /pre-?qualification|prequal/i)

    await expect(pageHeading(page, 'Review')).toBeVisible()
    await page.locator('.page-content .step-content').getByRole('button', { name: 'Submit' }).filter({ visible: true }).first().click()
    const submit = page.waitForResponse((r) => r.request().method() === 'POST' && /pre-?qualification|prequal/i.test(r.url()) && /submit|final|store/i.test(r.url()), { timeout: 480_000 })
    await page.getByRole('button', { name: 'Yes, Submit' }).click()
    const res = await submit
    await expectOk(res)

    await expect(pageHeading(page, 'Underwriting Result')).toBeVisible({ timeout: 480_000 })
    await expect(page.getByText('We could not load your underwriting result. Please refresh in a moment.')).toHaveCount(0)
  })
})
