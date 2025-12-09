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
