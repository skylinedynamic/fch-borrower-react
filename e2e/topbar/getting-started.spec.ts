import { test, expect, type Page, type Route } from '@playwright/test'

// The Getting Started walkthrough: the API works out the borrower's next step
// (GET /borrower/profile/completion -> onboarding); the portal shows it as a
// Next step button in the top bar, opens its popup once per step per login,
// and points an arrow at the menu item to open. Every backend call is answered
// here, at the API origin, so no session or backend is needed. Pages open on
// /payments, which renders with the empty data every other call gets.
const API_ORIGIN = 'http://127.0.0.1:8000/api/v1'
const USER = { id: 1, name: 'Jane Borrower', email: 'jane@example.test', entity_type: 'borrower', entity_id: 1 }

// The Next step button pulses for attention; under reduced motion (which the
// walkthrough's styles honour) it holds still long enough to be clicked.
test.use({ storageState: { cookies: [], origins: [] }, contextOptions: { reducedMotion: 'reduce' } })

type Step = 'complete_profile' | 'credit_profile' | 'verify_all' | 'upload_documents' | 'results_ready' | 'completed'
const COMPLETED: Record<Step, number> = { complete_profile: 0, credit_profile: 1, verify_all: 2, upload_documents: 3, results_ready: 4, completed: 5 }

async function signInOnStep(page: Page, step: Step, opts: { popupSeen?: boolean } = {}) {
  await page.addInitScript(
    ([u, seenStep]) => {
      window.localStorage.setItem(
        'auth',
        JSON.stringify({
          state: { token: 'e2e-fake-token', user: u, rememberMe: true, userSubscription: { subscription_status: 'active', is_free_trail: false } },
          version: 0,
        })
      )
      document.cookie = 'auth_session_active=true; path=/'
      if (seenStep) window.sessionStorage.setItem(`fch:onboarding:session-step:${u.id}`, seenStep)
    },
    [USER, opts.popupSeen ? step : null] as const
  )

  const ok = (route: Route, data: unknown) => route.fulfill({ json: { status: true, message: 'ok', data } })
  const complete = { is_complete: true, missing_fields: [] }

  await page.route(`${API_ORIGIN}/**`, (route) => ok(route, []))
  await page.route(`${API_ORIGIN}/common/refresh-user`, (route) => ok(route, USER))
  await page.route(`${API_ORIGIN}/borrower/agreement-sign/check`, (route) => ok(route, { needs_sign: false, template: null }))
  await page.route(`${API_ORIGIN}/borrower/profile/completion`, (route) =>
    ok(route, {
      ...complete,
      personal: complete,
      business: complete,
      financial: complete,
      onboarding: { flow: 'paid', current_step: step, completed_steps: COMPLETED[step], total_steps: 5, results_ready: false, pending_steps: [], selected_path: null },
      credit_card_stacking: { unlocked: false, credit_profile_verified: false, tier_0_completed: false },
    })
  )
}

const nextStepButton = (page: Page) => page.getByRole('button', { name: /^Next step:/ })
const popup = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Getting started' })

test.describe('Getting Started walkthrough', () => {
  test('opens its popup for the step once, and its button goes to the page that does it', async ({ page }) => {
    await signInOnStep(page, 'credit_profile')
    await page.goto('/payments')

    await expect(popup(page)).toBeVisible()
    await expect(popup(page)).toContainText('Submit your credit profile')
    await popup(page).getByRole('link', { name: /fill credit profile/i }).click()

    await expect(page).toHaveURL(/\/profile\?tab=3$/)
  })

  test('the Next step button in the top bar names the step and reopens the popup', async ({ page }) => {
    await signInOnStep(page, 'credit_profile', { popupSeen: true })
    await page.goto('/payments')

    const button = nextStepButton(page)
    await expect(button).toBeVisible()
    await expect(button).toHaveAccessibleName('Next step: Submit your credit profile (step 2 of 5)')
    // Seen this login already, so it waits for the button.
    await expect(popup(page)).toHaveCount(0)

    // It pulses for attention, so it never holds still for Playwright's stability check.
    await button.click({ force: true })
    await expect(popup(page)).toContainText('Submit your credit profile')
  })

  test('points the menu arrow at the Credit Builder group for Verify All', async ({ page }) => {
    await signInOnStep(page, 'verify_all', { popupSeen: true })
    await page.goto('/payments')

    // The guide is inside the closed Credit Builder group, so the arrow is on the group.
    const arrow = page.locator('#navbar-nav').getByRole('img', { name: 'Go here next: Click Verify All' })
    await expect(arrow).toHaveCount(1)
    await expect(arrow).toBeVisible()
    const arrowedItem = page.locator('#navbar-nav li.onb-menu-target', { has: page.getByRole('img', { name: 'Go here next: Click Verify All' }) })
    await expect(arrowedItem).toContainText('Credit Builder')
  })

  test('the documents step asks for the four required documents only', async ({ page }) => {
    await signInOnStep(page, 'upload_documents')
    await page.goto('/payments')

    await expect(popup(page)).toContainText('Upload your documents')
    await expect(popup(page)).toContainText('upload your four required documents')
    for (const name of ["Driver's License", 'Voided Business Check', 'EIN / Corporation Docs', 'Business Bank Statements']) {
      await expect(popup(page)).toContainText(name)
    }
    await expect(popup(page)).toContainText('Every other category is optional')
    await expect(popup(page)).not.toContainText('every document category')
  })

  test('shows nothing once the walkthrough is completed', async ({ page }) => {
    await signInOnStep(page, 'completed')
    await page.goto('/payments')

    await expect(page.locator('#navbar-nav')).toBeVisible()
    await expect(nextStepButton(page)).toHaveCount(0)
    await expect(page.locator('#navbar-nav li.onb-menu-target')).toHaveCount(0)
  })
})

test.describe('Credit Card Stacking (renamed from Capital Access)', () => {
  test('an old Capital Access link lands on Credit Card Stacking', async ({ page }) => {
    await signInOnStep(page, 'completed')
    await page.goto('/capital-access/strategy')

    await expect(page).toHaveURL(/\/credit-card-stacking\/strategy$/)
  })

  test('the menu calls it Credit Card Stacking', async ({ page }) => {
    await signInOnStep(page, 'completed')
    await page.goto('/payments')

    await expect(page.locator('#navbar-nav a[href="/credit-card-stacking"]')).toContainText('Credit Card Stacking')
    await expect(page.locator('#navbar-nav a[href="/capital-access"]')).toHaveCount(0)
  })
})
