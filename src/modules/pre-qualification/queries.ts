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
  return useMutation({
    mutationFn: submitFundingInfo,
    // Do NOT invalidate the pre-qualification query here.
    // The GET always returns null funding fields (by design — borrowers fill fresh each time).
    // Invalidating triggers a re-fetch which resets the local `support` state to empty,
    // causing the Review step to show all dashes for Funding Needs.
    // The Review step reads from local React state, not the API, so no re-fetch is needed.
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
