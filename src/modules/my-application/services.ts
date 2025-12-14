import { apiClient } from '../../lib/http/apiClient'
import type { PreQualificationResponse, AdvisorResponse, PreQualificationDetailResponse } from './types'

const BASE_URL = '/borrower/myapplication'
const preQualificationBaseUrl = '/borrower'

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
export const fetchPreQualificationDetail = async (id: number | string): Promise<PreQualificationDetailResponse> => {
  const { data } = await apiClient.get<PreQualificationDetailResponse>(`${preQualificationBaseUrl}/pre-qualification/${id}`)
  return data
}
