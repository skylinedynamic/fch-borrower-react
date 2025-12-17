import { apiClient } from '../../../lib/http/apiClient'
import type { TierTaskListResponse } from './types'

export const fetchTierTaskList = async (): Promise<TierTaskListResponse> => {
  const { data } = await apiClient.get<TierTaskListResponse>('/borrower/credit-builder/tier-wise-tasklist')
  return data
}
