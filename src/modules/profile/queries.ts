import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import { fetchPersonalInfo, savePersonalInfo, fetchBusinessDetails, saveBusinessDetails, fetchFinancialInfo, saveFinancialInfo, submitChangeRequest } from './services'
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
    },
  })
}

export const useSubmitChangeRequest = () => {
  return useMutation({
    mutationFn: (data: ChangeRequestRequest) => submitChangeRequest(data),
  })
}
