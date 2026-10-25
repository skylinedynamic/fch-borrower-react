import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import { fetchPersonalInfo, savePersonalInfo, fetchBusinessDetails, saveBusinessDetails, fetchFinancialInfo, saveFinancialInfo, submitChangeRequest, fetchProfileCompletion, completeOnboarding, skipOnboardingStep, resumeOnboardingStep, chooseOnboardingPath } from './services'
import type { ProfileCompletionResponse, ProfileCompletionStatus, ProfileOnboardingStatus } from './services'
import type { SavePersonalInfoRequest, SaveBusinessDetailsRequest, SaveFinancialInfoRequest, ChangeRequestRequest } from './types'

export const usePersonalInfo = () => {
  return useQuery({
    queryKey: queryKeys.profile.personalInfo(),
    queryFn: fetchPersonalInfo,
  })
}

export const useSavePersonalInfo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SavePersonalInfoRequest) => savePersonalInfo(data),
    onSuccess: () => {
      // Invalidate and refetch personal info after successful save
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.personalInfo() })
      // A save can finish the profile, which moves the Getting Started journey on.
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.completion() })
    },
  })
}

export const useBusinessDetails = () => {
  return useQuery({
    queryKey: queryKeys.profile.businessDetails(),
    queryFn: fetchBusinessDetails,
  })
}

export const useSaveBusinessDetails = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SaveBusinessDetailsRequest) => saveBusinessDetails(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.businessDetails() })
      // A save can finish the profile, which moves the Getting Started journey on.
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.completion() })
    },
  })
}

export const useFinancialInfo = () => {
  return useQuery({
    queryKey: queryKeys.profile.financialInfo(),
    queryFn: fetchFinancialInfo,
  })
}

export const useSaveFinancialInfo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SaveFinancialInfoRequest) => saveFinancialInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.financialInfo() })
      // A save can finish the profile, which moves the Getting Started journey on.
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.completion() })
    },
  })
}

export const useSubmitChangeRequest = () => {
  return useMutation({
    mutationFn: (data: ChangeRequestRequest) => submitChangeRequest(data),
  })
}

export const useProfileCompletion = (options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: queryKeys.profile.completion(),
    queryFn: fetchProfileCompletion,
    select: (response) => response.data,
    enabled: options.enabled ?? true,
  })
}

/**
 * Fetches the completion status afresh (e.g. straight after a save), for code
 * that needs the answer now rather than on the next render.
 */
export const useFetchProfileCompletion = () => {
  const queryClient = useQueryClient()
  return async (): Promise<ProfileCompletionStatus> => {
    const response = await queryClient.fetchQuery({
      queryKey: queryKeys.profile.completion(),
      queryFn: fetchProfileCompletion,
      staleTime: 0,
    })
    return response.data
  }
}

/** Puts the step an onboarding call moved the borrower to straight into the completion data. */
const useShowOnboardingStep = () => {
  const queryClient = useQueryClient()
  return async (onboarding: ProfileOnboardingStatus) => {
    // A fetch already in flight (every page change starts one) would land
    // after this and put the old step back.
    await queryClient.cancelQueries({ queryKey: queryKeys.profile.completion() })
    queryClient.setQueryData<ProfileCompletionResponse>(queryKeys.profile.completion(), (current) =>
      current ? { ...current, data: { ...current.data, onboarding } } : current
    )
  }
}

/** Records that the borrower reached Credit Card Stacking, and shows the step it leads to straight away. */
export const useCompleteOnboarding = () => {
  const showStep = useShowOnboardingStep()
  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (response) => showStep(response.data),
  })
}

/** Skips the borrower's current Getting Started step, and shows the next one straight away. */
export const useSkipOnboardingStep = () => {
  const showStep = useShowOnboardingStep()
  return useMutation({
    mutationFn: skipOnboardingStep,
    onSuccess: (response) => showStep(response.data),
  })
}

/** Goes back to a skipped Getting Started step, and shows it as the current step straight away. */
export const useResumeOnboardingStep = () => {
  const showStep = useShowOnboardingStep()
  return useMutation({
    mutationFn: resumeOnboardingStep,
    onSuccess: (response) => showStep(response.data),
  })
}

/** Saves the path the borrower chose once their results are ready, and shows it straight away. */
export const useChooseOnboardingPath = () => {
  const showStep = useShowOnboardingStep()
  return useMutation({
    mutationFn: chooseOnboardingPath,
    onSuccess: (response) => showStep(response.data),
  })
}
