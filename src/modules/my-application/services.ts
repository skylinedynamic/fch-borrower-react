import { apiClient } from '../../lib/http/apiClient'
import type { PreQualificationResponse, AdvisorResponse, PreQualificationDetailResponse, FundingApplicationResponse } from './types'

const BASE_URL = '/borrower/myapplication'
const preQualificationBaseUrl = '/borrower'

export const fetchPreQualificationRequests = async (page: number = 1): Promise<PreQualificationResponse> => {
  const { data } = await apiClient.post<PreQualificationResponse>(`${BASE_URL}/pre-qualification`, {
    page
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

export const fetchFundingApplicationDetail = async (id: number | string): Promise<FundingApplicationResponse> => {
  const { data } = await apiClient.get<FundingApplicationResponse>(`/common/request-application/funding-application/${id}`)
  return data
}

export const downloadFundingApplicationDocument = async (documentId: string | number): Promise<any> => {
    const response = await apiClient.get(`/borrower/funding-application/documents/${Number(documentId)}/download`, {
        responseType: 'blob'
    });
    return response;
};

export const fetchFundingApplications = async (page: number = 1): Promise<FundingApplicationResponse> => {
  const { data } = await apiClient.post<FundingApplicationResponse>(`${BASE_URL}/funding-application`, {
    page
  })
  return data
}
