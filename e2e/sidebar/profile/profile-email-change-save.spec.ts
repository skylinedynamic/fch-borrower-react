import { test, expect, openFromSidebar } from '../../support/fixtures'

// Real API. Writes a pending email change and cancels it again, so the
// borrower's sign-in email is never changed and the spec is safe to repeat.
//
// A new email saved on the profile isn't applied at once: it waits until the
// link sent to the new address is confirmed with the password. While it waits
// the field shows the pending email and a notice names the current one; the
// borrower can resend the link or cancel the change - from the notice, or by
// typing the current email back in (BUG-203).
test.describe('Sidebar › Profile › Personal Info — changing the email', () => {
  test('a new email waits for confirmation, and can be resent and cancelled', async ({ page }) => {
    await openFromSidebar(page, 'Profile', /\/profile$/)

    const email = page.getByPlaceholder('Enter email id')
    await expect(email).not.toHaveValue('')
    const current = await email.inputValue()
    const requested = `e2e-pending-${Date.now()}@example.test`

    // Saving asks for the change; the sign-in email stays as it was.
    await email.fill(requested)
    const save = page.waitForResponse((r) => r.url().includes('/borrower/profile/personal-info') && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    const saved = await save
    expect(saved.status()).toBe(200)
    expect((await saved.json()).data).toMatchObject({ email: current, pending_email: requested })

    await expect(page.getByText(`A confirmation link has been sent to ${requested}.`, { exact: false })).toBeVisible()
    const notice = page.getByRole('status').filter({ hasText: 'Waiting for confirmation' })
    await expect(notice).toContainText(requested)
    await expect(notice).toContainText(current)
    await expect(email).toHaveValue(requested)

    // The link can be sent again.
    const resend = page.waitForResponse((r) => r.url().includes('/borrower/profile/email-change/resend'))
    await notice.getByRole('button', { name: 'Resend link' }).click()
    expect((await resend).status()).toBe(200)
    await expect(page.getByText(`A new confirmation link has been sent to ${requested}.`)).toBeVisible()

    // Cancelling withdraws it.
    const cancel = page.waitForResponse((r) => r.url().includes('/borrower/profile/email-change/cancel'))
    await notice.getByRole('button', { name: 'Cancel change' }).click()
    expect((await cancel).status()).toBe(200)
    await expect(notice).toBeHidden()

    // Nothing changed: after a reload the field shows the same email, with nothing waiting.
    await page.reload()
    await expect(page.getByPlaceholder('Enter email id')).toHaveValue(current)
    await expect(page.getByRole('status').filter({ hasText: 'Waiting for confirmation' })).toHaveCount(0)
  })

  test('typing the current email back in withdraws a waiting change', async ({ page }) => {
    await openFromSidebar(page, 'Profile', /\/profile$/)

    const email = page.getByPlaceholder('Enter email id')
    await expect(email).not.toHaveValue('')
    const current = await email.inputValue()
    const requested = `e2e-pending-${Date.now()}@example.test`
    const saveResponse = () =>
      page.waitForResponse((r) => r.url().includes('/borrower/profile/personal-info') && r.request().method() === 'POST')

    await email.fill(requested)
    let save = saveResponse()
    await page.getByRole('button', { name: 'Save Changes' }).click()
    expect((await save).status()).toBe(200)
    const notice = page.getByRole('status').filter({ hasText: 'Waiting for confirmation' })
    await expect(notice).toContainText(requested)

    // Back to the current email: the change is withdrawn, not a new one asked for.
    await email.fill(current)
    save = saveResponse()
    await page.getByRole('button', { name: 'Save Changes' }).click()
    const saved = await save
    expect(saved.status()).toBe(200)
    expect((await saved.json()).data).toMatchObject({ email: current, pending_email: null })
    await expect(page.getByText('The pending email change has been cancelled.')).toBeVisible()
    await expect(notice).toBeHidden()

    await page.reload()
    await expect(page.getByPlaceholder('Enter email id')).toHaveValue(current)
    await expect(page.getByRole('status').filter({ hasText: 'Waiting for confirmation' })).toHaveCount(0)
  })
})
