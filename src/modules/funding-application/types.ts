export interface BusinessInfoData {
  full_name: string | null
  business_name: string | null
  business_ein: string | null
  business_phone_no: string | null
  business_address: string | null
  business_email: string | null
  duns_number: string | null
  country: string | null
  country_code: string | null
  business_state: string | null
  business_city: string | null
  business_postal_code: string | null
  business_website: string | null
  entity_type: string | null
  industry_type: string | null
  years_in_business: string | null
  number_of_employees: string | null
}

export interface BusinessInfoResponse {
  status: boolean
  message: string
  data: BusinessInfoData
}

export interface OwnershipInfoData {
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  ssn: string | null
  citizenship_status: string | null
  street_address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  ownership: string | null
  has_co_borrower: boolean
}

export interface OwnershipInfoResponse {
  status: boolean
  message: string
  data: OwnershipInfoData
}

export interface FinancialInfoData {
  monthly_revenue: string | null
  annual_revenue: string | null
  business_bank_name: string | null
  business_checking_start_date: string | null
  self_reported_personal_credit_score: string | null
  self_reported_business_credit_score: string | null
  has_business_debt: boolean
  debt_balance: string | null
}

export interface FinancialInfoResponse {
  status: boolean
  message: string
  data: FinancialInfoData
}

export interface DisclosuresConsentData {
  credit_pull_authorization: boolean
  terms_conditions_acceptance: boolean
}

export interface DisclosuresConsentResponse {
  status: boolean
  message: string
  data: DisclosuresConsentData
}
export interface FundingRequestData {
  requested_amount: string | null
  purpose_of_funds: string | null
  preferred_funding_type: string | null
  timeframe_needed: string | null
  collateral_available: string | null
}

export interface FundingRequestResponse {
  status: boolean
  message: string
  data: FundingRequestData
}
