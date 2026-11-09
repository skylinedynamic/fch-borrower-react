import { expect, type Frame, type Page } from '@playwright/test'

/** Stripe test cards (sandbox only). */
export const STRIPE_TEST_CARD = {
  SUCCEEDS: '4242424242424242',
  /** Always asks for 3-D Secure; the bank's test page offers Complete / Fail. */
  REQUIRES_3DS: '4000002760003184',
} as const

/**
 * From an open invoice's detail page: Pay Now, pick Stripe if a choice is shown,
 * and type a card into Stripe's card field. Returns the modal.
 */
export async function openPayNowWithCard(page: Page, cardNumber: string) {
  await page.getByRole('button', { name: /Pay Now/ }).click()
  const modal = page.locator('.modal.show').first()
  await expect(modal).toBeVisible()

  // Provider choice (skipped by the modal when Stripe is the only one).
  const stripeCard = modal.locator('.pps-card:not(.pps-card-skeleton)', { hasText: /Stripe/i })
  const cardIframe = modal.locator('iframe[name^="__privateStripeFrame"]').first()
  await expect(stripeCard.or(cardIframe).first()).toBeVisible({ timeout: 60_000 })
  if (await stripeCard.isVisible()) await stripeCard.click()
  await expect(cardIframe).toBeVisible({ timeout: 60_000 })

  const card = modal.frameLocator('iframe[name^="__privateStripeFrame"]').first()
  // Stripe's inputs only report "complete" for real keystrokes, so type them.
  await card.locator('input[name="cardnumber"]').pressSequentially(cardNumber, { delay: 30 })
  await card.locator('input[name="exp-date"]').pressSequentially('1234', { delay: 30 })
  await card.locator('input[name="cvc"]').pressSequentially('123', { delay: 30 })
  const zip = card.locator('input[name="postal"]')
  if (await zip.count()) await zip.pressSequentially('10001', { delay: 30 })

  return modal
}

/**
 * Answer Stripe's test 3-D Secure page. It opens in nested iframes Stripe
 * names itself, so the button is looked for in every frame rather than by path.
 */
export async function answer3dsChallenge(page: Page, answer: 'complete' | 'fail') {
  // The "3D Secure 2 Test Page" has exactly these two buttons.
  const name = answer === 'complete' ? 'Complete' : 'Fail'
  const buttonIn = (frame: Frame) => frame.getByRole('button', { name, exact: true })
  const findChallenge = async (): Promise<Frame | null> => {
    for (const frame of page.frames()) {
      if (await buttonIn(frame).count().catch(() => 0)) return frame
    }
    return null
  }

  // A click that lands before the test page has wired its buttons does
  // nothing, so keep answering until the challenge closes.
  const deadline = Date.now() + 90_000
  let answered = false
  while (Date.now() < deadline) {
    const frame = await findChallenge()
    if (!frame) {
      if (answered) return
      await page.waitForTimeout(500)
      continue
    }
    await buttonIn(frame).click({ timeout: 5_000 }).then(() => { answered = true }).catch(() => {})
    await page.waitForTimeout(2_000)
  }

  throw new Error(answered ? 'Stripe 3-D Secure test page did not close after answering' : 'Stripe 3-D Secure test page did not open')
}
