export interface CreditProfilePersonalInfo {
  name: string
  dob: string | null
  ssn: string | null
  email: string | null
  phone: string | null
}

export interface CreditProfileAddress {
  type: string
  street: string
  city: string
  state: string
  zip: string
  date_reported: string | null
}

export interface AllAccountsAnalysis {
  total_accounts?: number | null
  open_accounts?: number | null
  closed_accounts?: number | null
  newest_open_date?: string | null
  oldest_open_date?: string | null
  [key: string]: unknown
}

export interface OpenAccountsAnalysis {
  monthly_payments?: number | null
  balance?: number | null
  credit_limit?: number | null
  available_credit?: number | null
  utilization_ratio?: number | null
  [key: string]: unknown
}

export interface CreditProfileMetrics {
  fico_score: number | null
  paydex_score: number | null
  experian_intelliscore: number | null
  equifax_score: number | null
  active_tradelines: number | null
  total_credit_limit: number | null
  credit_utilization: number | null
  recent_inquiries: number | null
  delinquent_accounts: number | null
  public_records: number | null
  collections: number | null
  delinquencies_30_60_90: string | null
  summary: string | null
  all_accounts_analysis: AllAccountsAnalysis
  open_accounts_analysis: OpenAccountsAnalysis
}

export interface CreditProfile {
  personal_info: CreditProfilePersonalInfo
  addresses: CreditProfileAddress[]
  metrics: CreditProfileMetrics
}
