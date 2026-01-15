import { apiClient } from '../../lib/http/apiClient'
import type { BusinessInfoResponse, BusinessInfoData, OwnershipInfoResponse, OwnershipInfoData, FinancialInfoResponse, FinancialInfoData, DisclosuresConsentResponse, DisclosuresConsentData, FundingRequestResponse, FundingRequestData, FederalComplianceResponse, FederalComplianceData } from './types'

export const fetchBusinessInfo = async (): Promise<BusinessInfoData> => {
  const { data } = await apiClient.get<BusinessInfoResponse>('/borrower/funding-application/business-info')
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
