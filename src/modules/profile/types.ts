export type PersonalInfoData = {
  id: number
  first_name: string
  last_name: string
  email: string
  home_address: string
  city: string
  state: string
  zip_code: string
  country: string
  home_phone: string
  phone_number: string
  last_4_ssn: string
  date_of_birth: string
}

export type PersonalInfoResponse = {
  status: boolean
  message: string
  data: PersonalInfoData
}

export type SavePersonalInfoRequest = {
  first_name: string
  last_name: string
  email: string
  home_address: string
  city: string
  state: string
  zip_code: string
  country: string
  country_code: string
  phone_number: string
  home_phone?: string
  last_4_ssn: string
  date_of_birth: string
}

export type ValidationErrors = {
  [key: string]: string
}

export type ErrorResponse = {
  status: boolean
  message: string
  errors?: ValidationErrors
}

export type SavePersonalInfoResponse = {
  status: boolean
  message: string
  data?: PersonalInfoData
}

export type BusinessDetailsData = {
  business_name: string
  business_ein: string
  business_phone: string
  business_address: string
  business_email: string
  duns_number: string
  country: string
  country_code: string
  business_state: string
  business_city: string
  business_postal_code: string
  business_website: string
  business_entity_type: string
  business_entity_type_note?: string
  business_industry_type: string
  business_industry_type_note?: string
  business_start_date?: string
  business_credit_score?: number
  personal_credit_score?: number
}

export type BusinessDetailsResponse = {
  status: boolean
  message: string
  data: BusinessDetailsData
}

export type SaveBusinessDetailsRequest = {
  business_name: string
  business_ein: string
  business_phone: string
  business_email: string
  duns_number: string
  business_address: string
  business_city: string
  business_state: string
  business_zip_code: string
  business_website: string
  business_entity_type: string
  business_entity_type_note?: string
  business_industry_type: string
  business_industry_type_note?: string
  business_country: string
  business_country_code?: string
  business_start_date?: string
  business_credit_score?: number | null
  personal_credit_score?: number | null
}

export type SaveBusinessDetailsResponse = {
  status: boolean
  message: string
  data?: BusinessDetailsData
  errors?: ValidationErrors
}

export type BankAccount = {
  id?: number
  bank_name: string
  account_open_date: string | null
}

export type FinancialInfoData = {
  currency: string
  years_in_business: string
  monthly_revenue: string
  annual_revenue: string
  annual_personal_income: string
  bank_accounts: BankAccount[]
}

export type FinancialInfoResponse = {
  status: boolean
  message: string
  data: FinancialInfoData
}

export type SaveFinancialInfoRequest = {
  currency: string
  years_in_business?: string
  monthly_revenue: number
  annual_revenue: number
  annual_personal_income: number
  average_monthly_deposits?: number
  monthly_deposit_count?: number
  avg_bank_balance?: number
  current_business_debt?: number
  nsf_count?: number
  negative_days?: number
  bank_accounts: BankAccount[]
}

export type SaveFinancialInfoResponse = {
  status: boolean
  message: string
  data?: FinancialInfoData
  errors?: ValidationErrors
}

export type ChangeRequestRequest = {
  field_name: string
  new_value: string
  entity_type?: string
  entity_id?: number
  note?: string
}

export type ChangeRequestResponse = {
  status: boolean
  message: string
  data?: any
  errors?: ValidationErrors
}

