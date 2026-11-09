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

/**
 * One play runs at a time (the API's PlayAccessGuard), so while one runs the
 * others are locked. Said on the strategy list, on each lock, and when opening
 * another play by URL sends the borrower back (BUG-044).
 */
export const onePlayAtATimeMessage = (runningPlayName: string): string =>
  `You can run one play at a time. Finish ${runningPlayName} to start another.`

export const playsLockedWhileRunningLabel = (count: number): string =>
  `${count} locked while a play is running`

/** Router state PlayOverview sends with its redirect when the play is locked. */
export const PLAY_LOCKED_REDIRECT_STATE = { playLocked: true } as const

/** One toast per redirect, even when React runs the effect twice. */
export const PLAY_LOCKED_TOAST_ID = 'capital-access-play-locked'
