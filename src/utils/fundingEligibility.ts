import { ENGINE_STATUS_LABELS, ENGINE_STATUS_VALUES, FACTOR_STATUS_VALUES } from '../config/funding'

/** A readiness factor that stops the borrower: failed, restricted or weak. */
export const hasMissingReadinessFactors = (factors: Array<{ status?: string | null }> = []): boolean =>
  factors.some((factor) => {
    const status = factor.status?.toLowerCase()
    return status === FACTOR_STATUS_VALUES.FAILED || status === FACTOR_STATUS_VALUES.RESTRICTED || status === FACTOR_STATUS_VALUES.WEAK
  })

/**
 * The eligibility label a funding option shows - the same on its card and its
 * detail page (BUG-026: the card said "Likely Eligible" while the detail said
 * "Eligible Now", "Manual Review Required" or "Conditional"). Locked when the
 * option has no lenders, Failed while underwriting factors are missing,
 * otherwise the engine's own label.
 */
export const eligibilityLabel = ({
  engineStatus,
  engineStatusLabel,
  hasMissingFactors,
}: {
  engineStatus?: string | null
  engineStatusLabel?: string | null
  hasMissingFactors: boolean
}): string => {
  if (engineStatus === ENGINE_STATUS_VALUES.LOCKED) return ENGINE_STATUS_LABELS.LOCKED
  if (hasMissingFactors) return ENGINE_STATUS_LABELS.MISSING_INFO
  return engineStatusLabel || ENGINE_STATUS_LABELS.ELIGIBLE_NOW
}
