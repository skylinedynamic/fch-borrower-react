import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getBorrowerFundingReviews, getBorrowerFundingReview } from './services'

export const useBorrowerFundingReviews = (params: any) => {
    return useQuery({
        queryKey: ['borrowerFundingReviews', params],
        queryFn: () => getBorrowerFundingReviews(params),
        placeholderData: keepPreviousData,
    })
}

export const useBorrowerFundingReview = (id: number) => {
    return useQuery({
        queryKey: ['borrowerFundingReview', id],
        queryFn: () => getBorrowerFundingReview(id),
        enabled: !!id
    })
}
