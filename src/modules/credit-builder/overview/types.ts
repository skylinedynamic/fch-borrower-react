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

export interface TaskOverviewTier {
  id: number
  code: string
  name: string
  title: string
  subtitle: string
  description: string | null
  status: string
  order: number
  has_vendor: number
  task_to_complete: number | null
}

export interface Task {
  id: number
  title: string
  subtitle: string
  description: string | null
  status: 'verified' | 'processing' | 'pending' | 'rejected'
  rejection_reason: string | null
  completed_at: string | null
}

export interface TaskOverviewData {
  tier: TaskOverviewTier
  verified: Task[]
  processing: Task[]
  pending: Task[]
  rejected: Task[]
}

export interface TaskOverviewResponse {
  status: boolean
  message: string
  data: TaskOverviewData
}
