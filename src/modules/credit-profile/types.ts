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

/**
 * Where the client's credit pulls stand. Times are already formatted in their
 * own time zone by the API (e.g. "Sep 22, 2026 02:30 AM").
 */
export interface CreditPullStatus {
  last_pulled_at: string | null
  /** The latest update request: pending until a pull is attached, then completed. */
  last_request: {
    status: 'pending' | 'completed'
    requested_at: string | null
    pulled_at: string | null
  } | null
}

export interface CreditProfile {
  id: number
  pull_status?: CreditPullStatus
  personal_info: CreditProfilePersonalInfo
  addresses: CreditProfileAddress[]
  metrics: CreditProfileMetrics
}

// The `/borrower/profile/credit-profile` endpoint returns either the
// bureau-pulled CreditProfile above, or — when no credit profile has been
// pulled yet — the borrower's raw, previously-submitted credit profile
// request (flat first_name/last_name/... fields, per
// CreditProfileRequestResource on the backend). `personal_info` is declared
// here (always undefined) purely as a discriminant so the two shapes can be
// told apart via `!data.personal_info`.
export interface CreditProfileRequestData {
  first_name: string
  middle_name: string | null
  last_name: string
  address: string
  apt_suite_other: string | null
  city: string
  state: string
  zip: string
  ssn: string
  date_of_birth: string
  phone: string
  email: string
  created_at?: string
  personal_info?: undefined
}
