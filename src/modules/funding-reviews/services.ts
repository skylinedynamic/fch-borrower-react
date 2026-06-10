import { apiClient } from '../../lib/http/apiClient'

export const getBorrowerFundingReviews = async (params: any) => {
    const response = await apiClient.post('/borrower/funding/reviews/list', params)
    return response.data
}

export const getBorrowerFundingReview = async (id: number) => {
    const response = await apiClient.get(`/borrower/funding/reviews/${id}`)
    return response.data
}
