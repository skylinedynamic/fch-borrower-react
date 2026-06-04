import { apiClient } from '../../lib/http/apiClient'
import type { PreQualificationResponse, AdvisorResponse, PreQualificationDetailResponse, FundingApplicationResponse } from './types'

const BASE_URL = '/borrower/myapplication'
const preQualificationBaseUrl = '/borrower'

export const fetchPreQualificationRequests = async (page: number = 1, perPage: number = 5): Promise<PreQualificationResponse> => {
  const { data } = await apiClient.post<PreQualificationResponse>(`${BASE_URL}/pre-qualification`, { 
    page, 
    per_page: perPage 
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

export const fetchFundingApplications = async (page: number = 1, perPage: number = 5): Promise<FundingApplicationResponse> => {
  const { data } = await apiClient.post<FundingApplicationResponse>(`${BASE_URL}/funding-application`, { 
    page, 
    per_page: perPage 
  })
  return data
}
