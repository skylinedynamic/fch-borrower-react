import { test, expect } from '@playwright/test'
import { SLOW_TIMEOUT } from '../support/env'

// Guest password-recovery pages. No real account is used: the forgot-password
// request goes to an address that doesn't exist, so no email is sent.
test.describe('Forgot / reset password', () => {
  test('"Forgot password?" on the login page opens the request form', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL(/\/forgot-password$/)
    await expect(page.getByRole('heading', { name: 'Forgot Password?' })).toBeVisible()
    await expect(page.getByPlaceholder('Enter Email')).toBeVisible()
  })

  test('requesting a link for an unknown address answers without leaving the page', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByPlaceholder('Enter Email').fill('e2e-no-such-user@example.invalid')
    await page.locator('form button[type="submit"]').click()

    // Either a generic "if the email exists" success or a field error - both are answers.
    await expect(page.locator('.invalid-feedback:not(:empty), .alert, .text-success').first()).toBeVisible({ timeout: SLOW_TIMEOUT })
    await expect(page).toHaveURL(/\/forgot-password$/)
  })

  test('the forgot-password page links back to login', async ({ page }) => {
    await page.goto('/forgot-password')
    // "Wait, I remember my password... Click here"
    await page.locator('a[href="/login"]').click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('reset page without a token refuses to submit', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByRole('heading', { name: 'Create new password' })).toBeVisible()
    await page.getByPlaceholder('Enter password').fill('NewPassw0rd!')
    await page.getByPlaceholder('Confirm password').fill('NewPassw0rd!')
    await page.locator('form button[type="submit"]').click()
    await expect(page.getByText('Reset link is invalid or expired. Please use the link from your email.')).toBeVisible()
  })

  test('reset page shows the live password rules', async ({ page }) => {
    await page.goto('/reset-password?token=x&email=e2e@example.invalid')
    await expect(page.getByRole('heading', { name: 'Password must contain:' })).toBeVisible()
  })
})
