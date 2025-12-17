import { apiClient } from '../../../lib/http/apiClient'
import type { CreditProgressResponse, CreditProgressData } from './types'

export const fetchCreditProgress = async (): Promise<CreditProgressData> => {
  const { data } = await apiClient.get<CreditProgressResponse>('/borrower/credit-builder/my-progress')
  return data.data
}
