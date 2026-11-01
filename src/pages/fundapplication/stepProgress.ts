/**
 * Whether a funding application wizard step counts as complete, for the
 * Application Progress card and the step checkmarks.
 */

export const STEP_INDICES = {
  BUSINESS_INFO: 0,
  OWNERSHIP_INFO: 1,
  FINANCIAL_INFO: 2,
  FUNDING_REQUEST: 3,
  DOCUMENT_UPLOAD: 4,
  DISCLOSURES: 5,
  FEDERAL_COMPLIANCE: 6,
  ATTESTATION: 7,
} as const

type StepFlags = {
  is_business_info_saved?: boolean
  is_ownership_info_saved?: boolean
  is_financial_info_saved?: boolean
  is_funding_request_saved?: boolean
  is_disclosures_saved?: boolean
  is_federal_compliance_saved?: boolean
  signature_data?: unknown
  is_editable?: boolean
  status?: string | null
}

export type StepProgressInput = {
  fundingData?: StepFlags | null
  activeStep: number
  highestVisitedStep: number
  isStepValid: (stepIndex: number) => boolean
}

const isStepSaved = (step: number, data?: StepFlags | null): boolean => {
  if (step === STEP_INDICES.BUSINESS_INFO) return !!data?.is_business_info_saved
  if (step === STEP_INDICES.OWNERSHIP_INFO) return !!data?.is_ownership_info_saved
  if (step === STEP_INDICES.FINANCIAL_INFO) return !!data?.is_financial_info_saved
  if (step === STEP_INDICES.FUNDING_REQUEST) return !!data?.is_funding_request_saved
  if (step === STEP_INDICES.DOCUMENT_UPLOAD) return !!data?.is_disclosures_saved
  if (step === STEP_INDICES.DISCLOSURES) return !!data?.is_disclosures_saved
  if (step === STEP_INDICES.FEDERAL_COMPLIANCE) return !!data?.is_federal_compliance_saved
  if (step === STEP_INDICES.ATTESTATION) return !!data?.signature_data
  return true
}

export const isWizardStepComplete = (stepIndex: number, { fundingData, activeStep, highestVisitedStep, isStepValid }: StepProgressInput): boolean => {
  // An application the server no longer lets the borrower change has been
  // through every step, whatever per-step flags it carries - a converted or
  // older application has none, and a closed one read 0% (BUG-071).
  if (fundingData?.is_editable === false) return true

  // Strict linear progression: a step cannot be complete if any earlier step is
  // unsaved, or is the one on screen and currently invalid.
  for (let i = 0; i < stepIndex; i++) {
    if (i === STEP_INDICES.DOCUMENT_UPLOAD) continue
    if (!isStepSaved(i, fundingData)) return false
    if (activeStep === i && !isStepValid(i)) return false
  }

  // Document Upload has nothing to save. It is done once the borrower has moved
  // past it - in this visit, or earlier, shown by the next step being saved. Files
  // on file from elsewhere do not make it done on arrival (BUG-071: 63% on step 5).
  if (stepIndex === STEP_INDICES.DOCUMENT_UPLOAD) {
    return highestVisitedStep > stepIndex || activeStep > stepIndex || isStepSaved(stepIndex, fundingData)
  }

  if (!isStepSaved(stepIndex, fundingData)) return false

  // A signed application stays complete while its signing step is open: that
  // form starts empty for a new signature, which is not a missing one.
  const alreadySigned = stepIndex === STEP_INDICES.ATTESTATION && Boolean(fundingData?.signature_data)
  if (activeStep === stepIndex && !alreadySigned && !isStepValid(stepIndex)) return false

  return true
}
