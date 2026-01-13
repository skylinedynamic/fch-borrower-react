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
  personal_credit_score: string
  estimated_business_credit_score: string
  existing_business_debt: boolean | number
  debt_balance: string | null
  // Others
  notes: string | null
  status: string
}

export interface PreQualificationDetailResponse {
  status: boolean
  message: string
  data: PreQualificationDetail
}
