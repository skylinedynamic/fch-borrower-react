import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import { fetchBusinessInfo, fetchOwnershipInfo, fetchFinancialInfo, fetchDisclosuresConsent, fetchFundingRequest } from './services'

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
