export interface CreditProgressData {
  id: number
  name: string
  title: string
  subtitle: string
  description: string
  estimated_completion_time: string
  tasks_remaining_count: number
  task_complete_percentage: number
  tiers: import('../guide/types').Tier[]
}

export interface CreditProgressResponse {
  status: boolean
  message: string
  data: CreditProgressData
}
