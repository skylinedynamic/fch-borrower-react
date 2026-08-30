import { apiClient } from '../../../lib/http/apiClient'
import type { CreditProgressResponse, CreditProgressData, TaskOverviewResponse, TaskOverviewData } from './types'

export const fetchCreditProgress = async (): Promise<CreditProgressData> => {
  const { data } = await apiClient.get<CreditProgressResponse>('/borrower/credit-builder/my-progress')
  return data.data
}

export const fetchTaskOverview = async (): Promise<TaskOverviewData> => {
  const { data } = await apiClient.get<TaskOverviewResponse>('/borrower/credit-builder/task-overview')
  return data.data
}
