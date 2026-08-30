import { apiClient } from '../../../lib/http/apiClient'
import type { TierTaskListResponse, TaskVerifyRequest, TaskVerifyResponse } from './types'

export const fetchTierTaskList = async (): Promise<TierTaskListResponse> => {
  const { data } = await apiClient.get<TierTaskListResponse>('/borrower/credit-builder/tier-wise-tasklist')
  return data
}

export const verifyTierTasks = async (payload: TaskVerifyRequest): Promise<TaskVerifyResponse> => {
  const { data } = await apiClient.post<TaskVerifyResponse>('/borrower/credit-builder/task-verify-request', payload)
  return data
}
