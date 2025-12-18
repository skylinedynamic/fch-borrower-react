export interface Tier {
  id: number
  name: string
  title: string
  subtitle: string
  description: string
  estimated_completion_time: string
  status: string | null
  order: number
  tasks: TierTask[]
}

export interface TierTask {
  id: number
  title: string
  subtitle: string | null
  description: string
  status: import('../../../data/credit-builder').CreditBuilderStatus | null
  url: string | null
  button_title: string | null
  completed_at: string | null
  estimated_completion_days: string | null
}

export interface TierTaskListResponse {
  status: boolean
  message: string
  data: Tier[]
}
