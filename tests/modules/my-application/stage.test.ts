import { describe, expect, it } from 'vitest'
import { fundingApplicationStage, FUNDING_APPLICATION_STAGES } from '../../../src/modules/my-application'
import { FUNDING_APPLICATION_STATUS as S } from '../../../src/config/funding'

const stageLabel = (status: string) => FUNDING_APPLICATION_STAGES[fundingApplicationStage(status).index].label

describe('fundingApplicationStage', () => {
  it.each([
    [S.ON_HOLD, 'Started'],
    [S.DRAFT, 'Started'],
    [S.PENDING, 'Submitted'],
    [S.SUBMITTED, 'Submitted'],
    [S.UNDERWRITING_REVIEW, 'Underwriting'],
    [S.MISSING_DOCUMENTS, 'Underwriting'],
    [S.IN_VERIFICATION, 'Underwriting'],
    [S.APPROVED_CONDITIONAL, 'Approved'],
    [S.APPROVED_FINAL, 'Approved'],
    [S.MATCHED_TO_LENDER, 'With lender'],
    [S.OFFER_ISSUED, 'With lender'],
    [S.CLEARED_TO_FUND, 'With lender'],
    [S.FUNDED, 'Funded'],
    [S.CLOSED, 'Funded'],
  ])('puts %s at %s', (status, label) => {
    expect(stageLabel(status)).toBe(label)
    expect(fundingApplicationStage(status).denied).toBe(false)
  })

  it('marks a denied application, at the stage it reached in review', () => {
    expect(fundingApplicationStage(S.DENIED)).toEqual({ index: 2, denied: true })
  })

  it('falls back to the first stage for a status it does not know', () => {
    expect(fundingApplicationStage('Something new')).toEqual({ index: 0, denied: false })
  })

  it('flags the stages that need the client to act', () => {
    expect(fundingApplicationStage(S.MISSING_DOCUMENTS).actionRequired).toBe(true)
    expect(fundingApplicationStage(S.UNDERWRITING_REVIEW).actionRequired).toBeFalsy()
  })
})
