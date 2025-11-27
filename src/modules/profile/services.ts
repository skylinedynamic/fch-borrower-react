import { apiClient } from '../../lib/http/apiClient'
import type { PersonalInfoResponse, PersonalInfoData, SavePersonalInfoRequest, SavePersonalInfoResponse, BusinessDetailsResponse, BusinessDetailsData, SaveBusinessDetailsRequest, SaveBusinessDetailsResponse, FinancialInfoResponse, FinancialInfoData, SaveFinancialInfoRequest, SaveFinancialInfoResponse } from './types'

export const fetchPersonalInfo = async (): Promise<PersonalInfoData> => {
  const { data } = await apiClient.get<PersonalInfoResponse>('/borrower/profile/personal-info')
  return data.data
}

export const savePersonalInfo = async (payload: SavePersonalInfoRequest): Promise<SavePersonalInfoResponse> => {
  const { data } = await apiClient.post<SavePersonalInfoResponse>('/borrower/profile/personal-info', payload)
  return data
}

export const fetchBusinessDetails = async (): Promise<BusinessDetailsData> => {
  const { data } = await apiClient.get<BusinessDetailsResponse>('/borrower/profile/business-info')
  return data.data
}

export const saveBusinessDetails = async (payload: SaveBusinessDetailsRequest): Promise<SaveBusinessDetailsResponse> => {
  const { data } = await apiClient.post<SaveBusinessDetailsResponse>('/borrower/profile/business-info', payload)
  return data
}

export const fetchFinancialInfo = async (): Promise<FinancialInfoData> => {
  const { data } = await apiClient.get<FinancialInfoResponse>('/borrower/profile/financial-info')
  return data.data
}

export const saveFinancialInfo = async (payload: SaveFinancialInfoRequest): Promise<SaveFinancialInfoResponse> => {
  const { data } = await apiClient.post<SaveFinancialInfoResponse>('/borrower/profile/financial-info', payload)
  return data
}
