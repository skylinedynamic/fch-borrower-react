import { test, expect, openFromSidebar } from '../../support/fixtures'

// Real API, nothing written: only opens the date-of-birth picker.
//
// BUG-005 (QA round 2): a date of birth only had to be in the past, so a
// 17-year-old could be entered. The picker now offers 18 to 120 years old - the
// range the API checks (App\Rules\AdultDateOfBirth). A saved date of birth is
// locked, so the picker is then the Change Request's.
test.describe('Sidebar › Profile › Personal Info — date of birth range', () => {
  test('the date of birth picker offers years from 120 to 18 years ago only', async ({ page }) => {
    await openFromSidebar(page, 'Profile', /\/profile$/)

    const changeRequest = page
      .locator('.col-md-6', { has: page.getByText('Date of Birth', { exact: false }) })
      .getByRole('button', { name: 'Change Request' })

    if (await changeRequest.isVisible()) {
      await changeRequest.click()
      await page.locator('.modal').getByRole('textbox', { name: 'Select date of birth' }).click()
    } else {
      await page.getByRole('textbox', { name: 'Select date of birth' }).click()
    }

    const calendar = page.locator('.flatpickr-calendar.open')
    await expect(calendar).toBeVisible()
    await calendar.locator('.fp-yd-trigger[data-kind="year"]').click()

    const years = await calendar
      .locator('.fp-yd-list[data-kind="year"] .fp-yd-opt')
      .evaluateAll((opts) => opts.map((o) => Number(o.getAttribute('data-value') ?? o.textContent)))

    const thisYear = new Date().getFullYear()
    expect(Math.max(...years)).toBe(thisYear - 18)
    // The earliest day is the day after the 121st birthday.
    expect(Math.min(...years)).toBeGreaterThanOrEqual(thisYear - 121)
    expect(Math.min(...years)).toBeLessThanOrEqual(thisYear - 120)
    expect(years).not.toContain(thisYear - 17)
  })
})
