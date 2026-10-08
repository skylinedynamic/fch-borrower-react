import { apiClient } from '../../lib/http/apiClient'
import type { PersonalInfoResponse, PersonalInfoData, SavePersonalInfoRequest, SavePersonalInfoResponse, BusinessDetailsResponse, BusinessDetailsData, SaveBusinessDetailsRequest, SaveBusinessDetailsResponse, FinancialInfoResponse, FinancialInfoData, SaveFinancialInfoRequest, SaveFinancialInfoResponse, ChangeRequestRequest, ChangeRequestResponse } from './types'

export interface ProfileCompletionStatus {
  is_complete: boolean
  personal: {
    is_complete: boolean
    missing_fields: string[]
  }
  business: {
    is_complete: boolean
    missing_fields: string[]
  }
  financial: {
    is_complete: boolean
    missing_fields: string[]
  }
  /** The borrower's Getting Started step, worked out by the API (OnboardingStepService). */
  onboarding?: ProfileOnboardingStatus
}

type OnboardingStepName =
  | 'complete_profile'
  | 'credit_profile'
  | 'verify_all'
  | 'results_ready'
  | 'upload_documents'
  | 'completed'

/**
 * What a borrower with their results ready can choose to look at (mirrors
 * OnboardingStepService::PATHS in the API).
 */
export type OnboardingPathId = 'card_stacking' | 'single_card' | 'funding' | 'advisor'

export interface ProfileOnboardingStatus {
  /** Which journey: the full one for paid clients, or the short free-trial one (profile and credit profile). */
  flow?: 'paid' | 'free_trial'
  /** Null until the borrower has paid and completed their profile. */
  current_step: OnboardingStepName | null
  /** Steps really done; a skipped step doesn't count. */
  completed_steps: number
  total_steps: number
  /**
   * Whether Tier 0 and the credit profile really are verified. False on the
   * last step when the borrower got there by skipping.
   */
  results_ready?: boolean
  /** Skipped steps not yet really done: postponed, still to do. */
  pending_steps?: OnboardingStepName[]
  /** What the borrower chose once their results were ready; null until they choose. */
  selected_path?: OnboardingPathId | null
}

export interface ProfileCompletionResponse {
  status: boolean
  message: string
  data: ProfileCompletionStatus
}

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

export const fetchProfileCompletion = async (): Promise<ProfileCompletionResponse> => {
  const { data } = await apiClient.get<ProfileCompletionResponse>('/borrower/profile/completion')
  return data
}

export interface CompleteOnboardingResponse {
  status: boolean
  message: string
  data: ProfileOnboardingStatus
}

/**
 * Tells the API the borrower has opened Credit Card Stacking: the last Getting
 * Started step once their results are ready. Any other step is left as it is.
 */
export const completeOnboarding = async (): Promise<CompleteOnboardingResponse> => {
  const { data } = await apiClient.post<CompleteOnboardingResponse>('/borrower/profile/onboarding/complete')
  return data
}

/** Goes back to a Getting Started step the borrower skipped: it becomes the current step again. */
export const resumeOnboardingStep = async (step: string): Promise<CompleteOnboardingResponse> => {
  const { data } = await apiClient.post<CompleteOnboardingResponse>('/borrower/profile/onboarding/resume', { step })
  return data
}

/**
 * With the results ready, saves what the borrower is looking for (or changes
 * it). The API refuses until the results really are ready.
 */
export const chooseOnboardingPath = async (path: OnboardingPathId): Promise<CompleteOnboardingResponse> => {
  const { data } = await apiClient.post<CompleteOnboardingResponse>('/borrower/profile/onboarding/path', { path })
  return data
}

/** Skips the Getting Started step the borrower is on (only some steps allow it). */
export const skipOnboardingStep = async (step: string): Promise<CompleteOnboardingResponse> => {
  const { data } = await apiClient.post<CompleteOnboardingResponse>('/borrower/profile/onboarding/skip', { step })
  return data
}

export const submitChangeRequest = async (payload: ChangeRequestRequest): Promise<ChangeRequestResponse> => {
  const { data } = await apiClient.post<ChangeRequestResponse>('/borrower/profile/change-request', payload)
  return data
}
