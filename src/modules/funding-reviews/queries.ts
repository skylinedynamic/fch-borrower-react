import { useQuery } from '@tanstack/react-query'
import { getBorrowerFundingReviews, getBorrowerFundingReview } from './services'

export const useBorrowerFundingReviews = (params: any) => {
    return useQuery({
        queryKey: ['borrowerFundingReviews', params],
        queryFn: () => getBorrowerFundingReviews(params),
    })
}

export const useBorrowerFundingReview = (id: number) => {
    return useQuery({
        queryKey: ['borrowerFundingReview', id],
        queryFn: () => getBorrowerFundingReview(id),
        enabled: !!id
    })
}
