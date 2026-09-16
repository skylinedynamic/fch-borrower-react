import { apiClient } from '../../lib/http/apiClient'
import type { PreQualificationResponse, PreQualificationData, PersonalInfoRequest, BusinessInfoRequest, FundingInfoRequest, StepSubmissionResponse, SubmitPreQualificationRequest, SubmitPreQualificationResponse } from './types'

export const fetchPreQualification = async (): Promise<PreQualificationData> => {
  const { data } = await apiClient.get<PreQualificationResponse>('/borrower/pre-qualification')
  return data.data
}

// A submitted application, including its underwriting status and the
// borrower-safe result. Used by the Underwriting Result step.
export const getPreQualificationById = async (id: string | number): Promise<any> => {
  const { data } = await apiClient.get(`/borrower/pre-qualification/${id}`)
  return data
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

export const submitPreQualification = async (payload: SubmitPreQualificationRequest): Promise<SubmitPreQualificationResponse> => {
  // The submit can outlive a gateway timeout and still complete on the server,
  // so the caller checks the recorded outcome before announcing any failure.
  const { data } = await apiClient.post<SubmitPreQualificationResponse>('/borrower/pre-qualification/submit', payload, {
    headers: { 'X-Skip-Toast': 'true' },
  })
  return data
}

// Re-runs an underwriting review that did not complete. Accepted only while the
// review is in the failed state, so this cannot regenerate a finished result.
export const retryUnderwriting = async (id: string | number): Promise<any> => {
  const { data } = await apiClient.post('/borrower/pre-qualification/retry-underwriting', { id })
  return data
}
