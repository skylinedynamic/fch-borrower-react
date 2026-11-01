import { describe, expect, it } from 'vitest'
import { STEP_INDICES, isWizardStepComplete, type StepProgressInput } from '../../../src/pages/fundapplication/stepProgress'

const saved = {
  is_business_info_saved: true,
  is_ownership_info_saved: true,
  is_financial_info_saved: true,
  is_funding_request_saved: true,
}

const input = (overrides: Partial<StepProgressInput> = {}): StepProgressInput => ({
  fundingData: saved,
  activeStep: STEP_INDICES.DOCUMENT_UPLOAD,
  highestVisitedStep: STEP_INDICES.DOCUMENT_UPLOAD,
  isStepValid: () => true,
  ...overrides,
})

const completedCount = (overrides: Partial<StepProgressInput> = {}) =>
  Object.values(STEP_INDICES).filter(step => isWizardStepComplete(step, input(overrides))).length

/** BUG-071: the wizard's Application Progress. */
describe('isWizardStepComplete', () => {
  // Arriving on Document Upload made it 63% "Completed 5 of 8": the step
  // counted as done because the borrower had documents on file from elsewhere.
  it('does not count Document Upload on arrival', () => {
    expect(isWizardStepComplete(STEP_INDICES.DOCUMENT_UPLOAD, input())).toBe(false)
    expect(completedCount()).toBe(4)
  })

  it('counts Document Upload once the borrower has moved past it', () => {
    expect(isWizardStepComplete(STEP_INDICES.DOCUMENT_UPLOAD, input({ activeStep: STEP_INDICES.DISCLOSURES, highestVisitedStep: STEP_INDICES.DISCLOSURES }))).toBe(true)
  })

  it('counts Document Upload on a later visit when the step after it was saved', () => {
    const returning = input({ activeStep: 0, highestVisitedStep: 0, fundingData: { ...saved, is_disclosures_saved: true } })

    expect(isWizardStepComplete(STEP_INDICES.DOCUMENT_UPLOAD, returning)).toBe(true)
  })

  // Closed (Completed) application 86 showed 0% / "Completed 0 of 8 steps":
  // it carried none of the per-step saved flags.
  it('counts every step of a locked application', () => {
    const locked = input({
      activeStep: 0,
      highestVisitedStep: 0,
      isStepValid: () => false,
      fundingData: { is_editable: false, status: 'Completed' },
    })

    expect(completedCount(locked)).toBe(8)
  })

  it('still requires the steps before it, in order', () => {
    const gap = input({ fundingData: { ...saved, is_ownership_info_saved: false } })

    expect(isWizardStepComplete(STEP_INDICES.FINANCIAL_INFO, gap)).toBe(false)
  })
})
