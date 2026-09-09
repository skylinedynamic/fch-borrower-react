export interface PreQualificationRequest {
  id: number
  funding_type: string
  business_name: string
  industry: string
  date: string
  requested_amount: string
  status: string
}

export interface MetaLink {
  url: string | null
  label: string
  active: boolean
}

export interface Meta {
  current_page: number
  from: number
  to: number
  per_page: number
  total: number
  last_page: number
  next_page_url: string | null
  prev_page_url: string | null
  links: MetaLink[]
}

export interface PreQualificationResponse {
  status: boolean
  message: string
  data: PreQualificationRequest[]
  meta: Meta
}

export interface Advisor {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null
  created_at: string
}

export interface AdvisorResponse {
  status: boolean
  message: string
  data: Advisor
}
export interface PreQualificationDetail {
  id: number
  // Personal Info
  first_name: string
  last_name: string
  email: string
  phone_number: string
  business_website: string
  state_of_incorporation: string
  // Business Info
  business_name: string
  industry_type: string
  business_structure: string
  years_in_business: string
  monthly_revenue: string
  annual_revenue: string
  // Financial Info
  funding_requested_amount: string
  funding_urgency: string
  purpose_of_funding: string
  purpose_note: string
  personal_credit_score: string
  estimated_business_credit_score: string
  existing_business_debt: boolean | number
  debt_balance: string | null
  // Others
  notes: string | null
  status: string
  // Underwriting outcome. Only the client-safe generation is exposed to the
  // borrower — the internal memo, risk flags and lender routing never appear here.
  validation_status?: string | null
  validation_summary?: string | null
  gpt_status?: string | null
  gpt_generated_at?: string | null
  underwriting_result?: UnderwritingResult | null
}

export interface UnderwritingResult {
  borrower_summary?: string
  qualified_programs?: string[]
  document_checklist?: string[]
  next_steps?: string[]
}

export const GPT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  INCORRECT: 'INCORRECT',
  FAILED: 'FAILED',
} as const

export type GptStatus = typeof GPT_STATUS[keyof typeof GPT_STATUS]

export const VALIDATION_STATUS = {
  CORRECT: 'CORRECT',
  INCORRECT: 'INCORRECT',
} as const

export type ValidationStatus = typeof VALIDATION_STATUS[keyof typeof VALIDATION_STATUS]

export const isIncorrectUnderwriting = (
  app?: { gpt_status?: string | null; validation_status?: string | null } | null
): boolean => {
  const gpt = (app?.gpt_status || '').toUpperCase()
  const val = (app?.validation_status || '').toUpperCase()

  return (
    gpt === GPT_STATUS.INCORRECT ||
    gpt === 'NEEDS_CORRECTION' ||
    gpt === 'BLOCKED' ||
    val === VALIDATION_STATUS.INCORRECT ||
    val === 'NEEDS_CORRECTION' ||
    val === 'BLOCKED' ||
    val === 'INCORRECT INFORMATION'
  )
}

export interface PreQualificationDetailResponse {
  status: boolean
  message: string
  data: PreQualificationDetail
}

export interface FundingApplication {
  id: number
  borrower_id: number
  status: string
  full_name: string
  business_name: string
  business_email: string
  business_phone_no: string
  business_country: string
  business_country_code: string
  business_address: string
  business_city: string
  business_state: string
  business_postal_code: string
  industry_type: string
  entity_type: string
  years_in_business: string
  number_of_employees: string
  first_name: string
  last_name: string
  date_of_birth: string
  ssn: string
  citizenship_status: string
  street_address: string
  country: string
  city: string
  state: string
  zip_code: string
  ownership: string
  has_co_borrower: boolean
  monthly_revenue: string
  annual_revenue: string
  business_bank_name: string
  business_checking_start_date: string
  self_reported_personal_credit_score: string
  self_reported_business_credit_score: string
  has_business_debt: boolean
  debt_balance: string
  requested_amount: string
  purpose_of_funds: string
  purpose_note: string | null
  preferred_funding_type: string
  timeframe_needed: string
  collateral_available: string
  credit_pull_authorization: boolean
  terms_conditions_acceptance: boolean
  filed_for_bankruptcy: boolean | null
  any_pending_lawsuits: boolean | null
  has_federal_loan: boolean | null
  has_federal_debt: boolean | null
  has_criminal_offense: boolean | null
  has_parole_or_probation: boolean | null
  suspended_or_debarred: boolean | null
  any_outstanding_judgments_business: boolean | null
  any_outstanding_judgments_owner: boolean | null
  federal_compliance_disclosures_explanation: string | null
  attestation_authorization: boolean
}

export interface FundingApplicationResponse {
  status: boolean
  message: string
  data: FundingApplication[]
  meta: Meta
}
