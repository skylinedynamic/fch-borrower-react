export interface CreditProgressTier {
  id: number
  name: string
  title: string
  subtitle: string
  description: string
  status: string | null
  order: number
}

export interface CreditProgressData {
  id: number
  name: string
  title: string
  subtitle: string
  description: string
  current_tier_estimated_completion_days: number
  current_tier_tasks_remaining: number
  current_tier_complete_task: number
  current_tier_complete_percentage: number
  total_tasks_remaining: number
  total_complete_task: number
  total_complete_percentage: number
  tiers: CreditProgressTier[]
}

export interface CreditProgressResponse {
  status: boolean
  message: string
  data: CreditProgressData
}
