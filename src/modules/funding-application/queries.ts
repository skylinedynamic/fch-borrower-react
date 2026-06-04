import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query/queryKeys'
import { fetchBusinessInfo, saveBusinessInfo, fetchOwnershipInfo, saveOwnershipInfo, fetchFinancialInfo, saveFinancialInfo, fetchDisclosuresConsent, saveDisclosuresConsent, fetchFundingRequest, saveFundingRequest, fetchFederalCompliance, saveFederalCompliance, saveAttestation, fetchAttestation, fetchFundingApplicationDocuments, deleteFundingApplicationDocument, uploadFundingApplicationDocuments, validateCoBorrower } from './services'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FundingRequestData, FundingApplicationDocument } from './types'

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
  })
}

export const useBusinessInfo = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.businessInfo(),
    queryFn: fetchBusinessInfo,
  })
}

export const useOwnershipInfo = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.ownershipInfo(),
    queryFn: fetchOwnershipInfo,
  })
}

export const useFinancialInfo = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.financialInfo(),
    queryFn: fetchFinancialInfo,
  })
}

export const useDisclosuresConsent = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.disclosuresConsent(),
    queryFn: fetchDisclosuresConsent,
  })
}

export const useFundingRequest = (options?: { enabled?: boolean }) => {
  return useQuery<FundingRequestData>({
    queryKey: queryKeys.fundingApplication.fundingRequest(),
    queryFn: fetchFundingRequest,
    enabled: options?.enabled,
  })
}

export const useFederalCompliance = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.federalCompliance(),
    queryFn: fetchFederalCompliance,
  })
}

export const useFundingApplicationDocuments = (id: number | null, options?: { enabled?: boolean }) => {
  return useQuery<FundingApplicationDocument[]>({
    queryKey: queryKeys.fundingApplication.documents(id),
    queryFn: () => fetchFundingApplicationDocuments(id!),
    enabled: options?.enabled !== undefined ? options.enabled && !!id : !!id,
  })
}

export const useDeleteFundingApplicationDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteFundingApplicationDocument,
    onSuccess: () => {
      // We'll invalidate in the component since we need the fundingRequestId
    },
  })
}

export const useUploadFundingApplicationDocuments = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadFundingApplicationDocuments,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fundingApplication.documents(variables.funding_application_id) })
    },
  })
}

export const useValidateCoBorrower = () => {
  return useMutation({
    mutationFn: validateCoBorrower,
  })
}
