import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getBorrowerFundingRequests, getBorrowerFundingRequest } from './services'

export const useBorrowerFundingRequests = (params: any) => {
    return useQuery({
        queryKey: ['borrowerFundingRequests', params],
        queryFn: () => getBorrowerFundingRequests(params),
        placeholderData: keepPreviousData,
    })
}

export const useBorrowerFundingRequest = (id: number) => {
    return useQuery({
        queryKey: ['borrowerFundingRequest', id],
        queryFn: () => getBorrowerFundingRequest(id),
        enabled: !!id
    })
}
