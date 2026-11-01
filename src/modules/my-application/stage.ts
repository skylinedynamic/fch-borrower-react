import { FUNDING_APPLICATION_STATUS as S } from '../../config/funding'

/**
 * The milestones a funding application moves through, as the client sees
 * them. The nineteen lifecycle statuses fold into these six, so the progress
 * tracker on the detail page stays readable.
 */
export const FUNDING_APPLICATION_STAGES = [
  { label: 'Started', statuses: [S.ON_HOLD, S.DRAFT] },
  { label: 'Submitted', statuses: [S.PENDING, S.SUBMITTED] },
  { label: 'Underwriting', statuses: [S.UNDERWRITING_REVIEW, S.MISSING_DOCUMENTS, S.IN_VERIFICATION] },
  { label: 'Approved', statuses: [S.APPROVED_CONDITIONAL, S.APPROVED_FINAL] },
  {
    label: 'With lender',
    statuses: [S.MATCHED_TO_LENDER, S.SUBMITTED_TO_LENDER, S.LENDER_REVIEWING, S.OFFER_ISSUED, S.OFFER_ACCEPTED, S.CONTRACTING_DOCS_OUT, S.CLEARED_TO_FUND],
  },
  { label: 'Funded', statuses: [S.FUNDED, S.CLOSED] },
] as const

/** Statuses that wait on the client rather than on FCH or a lender. */
const ACTION_REQUIRED: readonly string[] = [S.MISSING_DOCUMENTS]

/** A denial is decided in underwriting, so it is shown at that milestone. */
const DENIED_AT = FUNDING_APPLICATION_STAGES.findIndex((stage) => stage.label === 'Underwriting')

export interface FundingApplicationStage {
  /** Index into FUNDING_APPLICATION_STAGES. */
  index: number
  denied: boolean
  actionRequired?: boolean
}

export function fundingApplicationStage(status: string): FundingApplicationStage {
  if (status === S.DENIED) return { index: DENIED_AT, denied: true }

  const index = FUNDING_APPLICATION_STAGES.findIndex((stage) => (stage.statuses as readonly string[]).includes(status))

  return {
    index: Math.max(index, 0),
    denied: false,
    ...(ACTION_REQUIRED.includes(status) ? { actionRequired: true } : {}),
  }
}
