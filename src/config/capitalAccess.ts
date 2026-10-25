/**
 * Reasons the Credit Card Stacking overview gives (`reason_code`) for being
 * locked: the borrower can't start a strategy until the requirement is met.
 * The Estimated Total Access card shows each with a lock.
 */
const LOCKED_REASON_CODES = [
  'TIER_BELOW_MINIMUM',
  'FICO_BELOW_MINIMUM',
  'UTILIZATION_ABOVE_MAXIMUM',
  'RECENT_LATE_PAYMENTS',
  'REQUIREMENTS_NOT_MET',
]

/** Whether the overview is locked, so there is no strategy to choose yet. */
export const isCapitalAccessLocked = (reasonCode: string | null | undefined): boolean =>
  !!reasonCode && LOCKED_REASON_CODES.includes(reasonCode)
