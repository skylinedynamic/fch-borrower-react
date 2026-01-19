import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query/queryKeys'
import { fetchBusinessInfo, saveBusinessInfo, fetchOwnershipInfo, saveOwnershipInfo, fetchFinancialInfo, saveFinancialInfo, fetchDisclosuresConsent, saveDisclosuresConsent, fetchFundingRequest, saveFundingRequest, fetchFederalCompliance, saveFederalCompliance, saveAttestation, fetchAttestation } from './services'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useSaveBusinessInfo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveBusinessInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fundingApplication.businessInfo() })
    },
  })
}

export const useSaveOwnershipInfo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveOwnershipInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fundingApplication.ownershipInfo() })
    },
  })
}

export const useSaveFinancialInfo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveFinancialInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fundingApplication.financialInfo() })
    },
  })
}

export const useSaveFundingRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveFundingRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fundingApplication.fundingRequest() })
    },
  })
}

export const useSaveDisclosuresConsent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveDisclosuresConsent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fundingApplication.disclosuresConsent() })
    },
  })
}

export const useSaveFederalCompliance = () => {
   const queryClient = useQueryClient()
   return useMutation({
     mutationFn: saveFederalCompliance,
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: queryKeys.fundingApplication.federalCompliance() })
     },
   })
 }

 export const useSaveAttestation = () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: saveAttestation,
      // No query key to invalidate as there is no fetchAttestation yet, but keeping structure clean
    })
  }

  export const useAttestation = () => {
   return useQuery({
     queryKey: ['attestation'], // Ideally this would be in queryKeys factory
     queryFn: fetchAttestation,
     staleTime: 1000 * 60 * 5,
   })
 }

export const useBusinessInfo = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.businessInfo(),
    queryFn: fetchBusinessInfo,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useOwnershipInfo = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.ownershipInfo(),
    queryFn: fetchOwnershipInfo,
    staleTime: 1000 * 60 * 5,
  })
}

export const useFinancialInfo = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.financialInfo(),
    queryFn: fetchFinancialInfo,
    staleTime: 1000 * 60 * 5,
  })
}

export const useDisclosuresConsent = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.disclosuresConsent(),
    queryFn: fetchDisclosuresConsent,
    staleTime: 1000 * 60 * 5,
  })
}

export const useFundingRequest = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.fundingRequest(),
    queryFn: fetchFundingRequest,
    staleTime: 1000 * 60 * 5,
  })
}

export const useFederalCompliance = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.federalCompliance(),
    queryFn: fetchFederalCompliance,
    staleTime: 1000 * 60 * 5,
  })
}
