import { apiClient } from '../../lib/http/apiClient'
import type { PreQualificationResponse, AdvisorResponse } from './types'

const BASE_URL = '/borrower/myapplication'

export const fetchPreQualificationRequests = async (page: number = 1): Promise<PreQualificationResponse> => {
  const { data } = await apiClient.get<PreQualificationResponse>(`${BASE_URL}/pre-qualification`, {
    params: { page }
  })
  return data
}

export const fetchAdvisor = async (): Promise<AdvisorResponse> => {
  const { data } = await apiClient.get<AdvisorResponse>('/borrower/get-advisor')
  return data
}
