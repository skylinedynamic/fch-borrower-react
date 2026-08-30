export interface Vendor {
  id: number
  name: string
  category: string
  requirements: string[]
  benefits: string[]
  report_to: string[]
  tier_id: number
  status: string
  description: string | null
  general_url: string | null
  affiliate_url: string | null
  logo: string | null
}

export interface Tier {
  id: number
  code: string
  name: string
  title: string
  subtitle: string
  description: string | null
  status: string | null
  order: number
  has_vendor: number
  task_to_complete: number | null
  tasks: TierTask[]
}

export interface TierTask {
  id: number
  title: string
  subtitle: string | null
  description: string | null
  logo?: string | null
  status: import('../../../data/credit-builder').CreditBuilderStatus | null
  url: string | null
  button_title: string | null
  completed_at: string | null
  estimated_completion_days: number | null
  note?: string | null
  order: number
  vendor: Vendor | null
  migrated_task_id: number | null
}

export interface TierTaskListResponse {
  status: boolean
  message: string
  data: Tier[]
}

export interface TaskVerifyRequest {
  task_ids: number[]
  migrated_task_id?: number | null
  tier_id?: number
}

export interface TaskVerifyResponse {
  success: boolean
  message: string
  data: {
    id: number
    borrower_id: number
    partner_id: number
    tier_id: number
    task_id: number
    status: string
    verified_by: null | number
    verified_at: null | string
  }[]
}
