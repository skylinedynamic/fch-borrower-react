import { apiClient } from '../../lib/http';

export const fetchBorrowerFunding = async () => {
    const response = await apiClient.get('/borrower/funding');
    return response.data;
};

export const fetchFundingDetail = async (id: string | undefined) => {
    const response = await apiClient.get(`/borrower/funding/${id}`);
    return response.data;
};
