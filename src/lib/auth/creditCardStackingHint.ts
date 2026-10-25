/**
 * Whether Credit Card Stacking was open the last time this browser checked,
 * per borrower. Only a hint for which skeleton to show while the real answer
 * (the API's `credit_card_stacking.unlocked`) loads; never used to decide access.
 */
const KEY_PREFIX = 'fch:ccs-unlocked:'

export function rememberCreditCardStackingUnlocked(userId: number | string, unlocked: boolean): void {
  try {
    if (unlocked) localStorage.setItem(KEY_PREFIX + userId, '1')
    else localStorage.removeItem(KEY_PREFIX + userId)
  } catch {
    // Storage unavailable: the locked skeleton is shown, which is fine.
  }
}

export function wasCreditCardStackingUnlocked(userId: number | string | undefined): boolean {
  if (userId == null) return false
  try {
    return localStorage.getItem(KEY_PREFIX + userId) === '1'
  } catch {
    return false
  }
}
