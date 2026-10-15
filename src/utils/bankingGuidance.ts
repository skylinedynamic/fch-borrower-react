import { FACTOR_STATUS_VALUES } from '../config/funding'

export interface BankingGuidance {
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

  return failed ? { message: failed.message as string, action: failed.action } : null
}
