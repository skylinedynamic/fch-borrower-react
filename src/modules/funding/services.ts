import { apiClient } from '../../lib/http';

export const fetchBorrowerFunding = async () => {
    const response = await apiClient.get('/borrower/funding');
    return response.data;
};
