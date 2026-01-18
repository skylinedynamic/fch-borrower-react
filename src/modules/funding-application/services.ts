import { apiClient } from '../../lib/http/apiClient'
import type { BusinessInfoResponse, BusinessInfoData, OwnershipInfoResponse, OwnershipInfoData, FinancialInfoResponse, FinancialInfoData, DisclosuresConsentResponse, DisclosuresConsentData, FundingRequestResponse, FundingRequestData, FederalComplianceResponse, FederalComplianceData } from './types'

export type BusinessInfoPayload = {
  id: number | null
  full_name: string | null
  business_name: string | null
  business_email: string | null
  business_phone_no: string | null
  business_country: string | null
  business_country_code: string | null
  business_address: string | null
  business_city: string | null
  business_state: string | null
  business_postal_code: string | null
  industry_type: string | null
  entity_type: string | null
  years_in_business: string | null
  number_of_employees: number | null
}

export type FinancialInfoPayload = {
  id: number | null
  monthly_revenue: string | null
  annual_revenue: string | null
  business_bank_name: string | null
  business_checking_start_date: string | null
  self_reported_personal_credit_score: string | null
  self_reported_business_credit_score: string | null
  has_business_debt: boolean
  debt_balance: string | null
}

export type OwnershipInfoPayload = {
  id: number | null
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  ssn: string | null
  citizenship_status: string | null
  street_address: string | null
  country: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  ownership: string | null
  has_co_borrower: boolean
}


export const fetchBusinessInfo = async (): Promise<BusinessInfoData> => {
  const { data } = await apiClient.get<BusinessInfoResponse>('/borrower/funding-application/business-info')
  return data.data
}

export const saveBusinessInfo = async (payload: BusinessInfoPayload): Promise<BusinessInfoData> => {
  const { data } = await apiClient.post<BusinessInfoResponse>('/borrower/funding-application/business-info', payload)
  return data.data
}

export const saveOwnershipInfo = async (payload: OwnershipInfoPayload): Promise<OwnershipInfoData> => {
  const { data } = await apiClient.post<OwnershipInfoResponse>('/borrower/funding-application/ownership-info', payload)
  return data.data
}

export const saveFinancialInfo = async (payload: FinancialInfoPayload): Promise<FinancialInfoData> => {
  const { data } = await apiClient.post<FinancialInfoResponse>('/borrower/funding-application/financial-info', payload)
  return data.data
}

export const fetchOwnershipInfo = async (): Promise<OwnershipInfoData> => {
  const { data } = await apiClient.get<OwnershipInfoResponse>('/borrower/funding-application/ownership-info')
  return data.data
}

export const fetchFinancialInfo = async (): Promise<FinancialInfoData> => {
  const { data } = await apiClient.get<FinancialInfoResponse>('/borrower/funding-application/financial-info')
  return data.data
}

export const fetchDisclosuresConsent = async (): Promise<DisclosuresConsentData> => {
  const { data } = await apiClient.get<DisclosuresConsentResponse>('/borrower/funding-application/disclosures-and-consent')
  return data.data
}

export const fetchFundingRequest = async (): Promise<FundingRequestData> => {
  const { data } = await apiClient.get<FundingRequestResponse>('/borrower/funding-application/funding-request')
  return data.data
}

export const fetchFederalCompliance = async (): Promise<FederalComplianceData> => {
  const { data } = await apiClient.get<FederalComplianceResponse>('/borrower/funding-application/federal-compliance-disclosures')
  return data.data
}
