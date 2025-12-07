import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import { fetchPreQualification, submitPersonalInfo, submitBusinessInfo, submitFundingInfo, submitPreQualification } from './services'

export const usePreQualification = () => {
  return useQuery({
    queryKey: queryKeys.preQualification.all,
    queryFn: fetchPreQualification,
  })
}

export const useSubmitPersonalInfo = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: submitPersonalInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preQualification.all })
    }
  })
}

export const useSubmitBusinessInfo = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: submitBusinessInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preQualification.all })
    }
  })
}

export const useSubmitFundingInfo = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: submitFundingInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preQualification.all })
    }
  })
}

export const useSubmitPreQualification = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: submitPreQualification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preQualification.all })
    }
  })
}
