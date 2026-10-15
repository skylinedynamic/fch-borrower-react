import { FACTOR_STATUS_VALUES } from '../config/funding'

export interface BankingGuidance {
  /** The banner heading: what is wrong with the bank statements. */
  title: string
  /** The line under the heading: what the borrower should do. */
  detail: string
  /** The API's one-line message, used where there is room for one line only. */
  message: string
  action?: { label: string; path: string }
}

interface FactorLike {
  label?: string
  status?: string
  group?: string
  reason_code?: string
  message?: string
  action?: { label: string; path: string }
}

/** The group the API gives every check judged from the bank statements. */
export const BANKING_FACTOR_GROUP = 'banking'

/** Banner text for the Banking Activity reasons the API sends (`reason_code`). */
const BANNER_BY_REASON: Record<string, { title: string; detail: string }> = {
  not_uploaded: { title: 'Bank statements required', detail: 'Upload your business bank statements to continue.' },
  rejected: { title: 'Bank statements rejected', detail: 'Upload new business bank statements to continue.' },
}

/** Heading when the statements are on file but their figures fall short. */
const FIGURES_FAILED_TITLE = 'Bank statements need attention'

/**
 * The message and upload link the API attaches to a failed bank-statement
 * check (deposits, balance, NSF, negative days, statements on file). Several
 * banking checks can fail at once; they share one message, so the first is
 * returned. Null when every banking check passed.
 */
export function bankingGuidance(factors: FactorLike[] | null | undefined): BankingGuidance | null {
  const failedBanking = (factors ?? []).filter(
    (factor) =>
      factor.group === BANKING_FACTOR_GROUP &&
      factor.status?.toLowerCase() === FACTOR_STATUS_VALUES.FAILED &&
      !!factor.message
  )
  // Statements missing, rejected or under review (a reason_code) explain any
  // figure failures too, so that message wins.
  const failed = failedBanking.find((factor) => !!factor.reason_code) ?? failedBanking[0]
  if (!failed) return null

  const message = failed.message as string
  const banner = (failed.reason_code && BANNER_BY_REASON[failed.reason_code]) || { title: FIGURES_FAILED_TITLE, detail: message }

  return { ...banner, message, action: failed.action }
}
