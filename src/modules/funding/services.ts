import { apiClient } from '../../lib/http';

export const fetchBorrowerFunding = async () => {
    const response = await apiClient.get('/borrower/funding');
    return response.data;
};

export const fetchFundingDetail = async (id: string | undefined) => {
    const response = await apiClient.get(`/borrower/funding/${id}`);
    return response.data;
};

export const fetchReadinessFactors = async (id: string | undefined) => {
    const response = await apiClient.get(`/common/funding-qualification/${id}/readiness-factors`);
    return response.data;
};

export const fetchQualifyReasons = async (id: string | undefined) => {
    const response = await apiClient.get(`/common/funding-qualification/${id}/qualify-reasons`);
    return response.data;
};
