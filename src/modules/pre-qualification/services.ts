import { apiClient } from '../../lib/http/apiClient'
import type { PreQualificationResponse, PreQualificationData, PersonalInfoRequest, BusinessInfoRequest, FundingInfoRequest, StepSubmissionResponse } from './types'

export const fetchPreQualification = async (): Promise<PreQualificationData> => {
  const { data } = await apiClient.get<PreQualificationResponse>('/borrower/pre-qualification')
  return data.data
}

export const submitPersonalInfo = async (payload: PersonalInfoRequest): Promise<StepSubmissionResponse['data']> => {
  const { data } = await apiClient.post<StepSubmissionResponse>('/borrower/pre-qualification/personal-info', payload)
  return data.data
}

export const submitBusinessInfo = async (payload: BusinessInfoRequest): Promise<StepSubmissionResponse['data']> => {
  const { data } = await apiClient.post<StepSubmissionResponse>('/borrower/pre-qualification/business-info', payload)
  return data.data
}

export const submitFundingInfo = async (payload: FundingInfoRequest): Promise<StepSubmissionResponse['data']> => {
  const { data } = await apiClient.post<StepSubmissionResponse>('/borrower/pre-qualification/funding-info', payload)
  return data.data
}
