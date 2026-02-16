import { apiClient } from '../../lib/http/apiClient'
import type { BusinessInfoResponse, BusinessInfoData, OwnershipInfoResponse, OwnershipInfoData, FinancialInfoResponse, FinancialInfoData, DisclosuresConsentResponse, DisclosuresConsentData, FundingRequestResponse, FundingRequestData, FederalComplianceResponse, FederalComplianceData, AttestationData, AttestationResponse, FundingApplicationDocument, FundingApplicationDocumentsResponse } from './types'

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

export type FundingRequestPayload = {
  id: number | null
  requested_amount: string | null
  purpose_of_funds: string | null
  preferred_funding_type: string | null
  timeframe_needed: string | null
  collateral_available: string | null
}

export type DisclosuresConsentPayload = {
  id: number | null
  credit_pull_authorization: boolean
  terms_conditions_acceptance: boolean
}

export type FederalCompliancePayload = {
  id: number | null
  filed_for_bankruptcy: boolean | null
  any_pending_lawsuits: boolean | null
  has_federal_loan: boolean | null
  has_federal_debt: boolean | null
  has_criminal_offense: boolean | null
  has_parole_or_probation: boolean | null
  suspended_or_debarred: boolean | null
  any_outstanding_judgments_business: boolean | null
  any_outstanding_judgments_owner: boolean | null
  federal_compliance_disclosures_explanation: string | null
}

export type AttestationPayload = {
  id: number | null
  attestation_authorization: boolean
}

export type CoBorrowerValidationPayload = {
  first_name: string
  last_name: string
  role: string
  ownership: string
  email: string
  mobile_phone: string
  home_phone: string
  date_of_birth: string
  ssn: string
  street_address: string
  country: string
  state: string
  city: string
  zip_code: string
  drivers_license_number: string
  drivers_license_state: string
  phone_country_code: string
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

export const saveFundingRequest = async (payload: FundingRequestPayload): Promise<FundingRequestData> => {
  const { data } = await apiClient.post<FundingRequestResponse>('/borrower/funding-application/funding-request', payload)
  return data.data
}

export const saveDisclosuresConsent = async (payload: DisclosuresConsentPayload): Promise<DisclosuresConsentData> => {
  const { data } = await apiClient.post<DisclosuresConsentResponse>('/borrower/funding-application/disclosures-and-consent', payload)
  return data.data
}

export const fetchFederalCompliance = async (): Promise<FederalComplianceData> => {
  const { data } = await apiClient.get<FederalComplianceResponse>('/borrower/funding-application/federal-compliance-disclosures')
  return data.data
}

export const saveFederalCompliance = async (payload: FederalCompliancePayload): Promise<FederalComplianceData> => {
  const { data } = await apiClient.post<FederalComplianceResponse>('/borrower/funding-application/federal-compliance-disclosures', payload)
  return data.data
}

export const fetchAttestation = async (): Promise<AttestationData> => {
  const { data } = await apiClient.get<AttestationResponse>('/borrower/funding-application/attestation-authorization')
  return data.data
}

export const saveAttestation = async (payload: AttestationPayload): Promise<AttestationData> => {
  const { data } = await apiClient.post<AttestationResponse>('/borrower/funding-application/attestation-authorization', payload)
  return data.data
}

export const fetchFundingApplicationDocuments = async (id: number): Promise<FundingApplicationDocument[]> => {
  const { data } = await apiClient.get<FundingApplicationDocumentsResponse>(`/borrower/funding-application/documents/${id}`)
  return data.data
}

export const deleteFundingApplicationDocument = async (documentId: number): Promise<{ message: string }> => {
  const { data } = await apiClient.delete(`/borrower/funding-application/documents/${documentId}`)
  return data
}

export const uploadFundingApplicationDocuments = async (payload: {
  funding_application_id: number
  document_type_id: number
  files: string[]
}): Promise<{ message: string }> => {
  const { data } = await apiClient.post('/borrower/funding-application/documents/upload', payload)
  return data
}

export const validateCoBorrower = async (payload: CoBorrowerValidationPayload): Promise<any> => {
  const { data } = await apiClient.post('/borrower/myapplication/funding-application/co-borrower-validation', payload)
  return data
}
