import { apiClient } from '../../lib/http';

export const fetchBorrowerFunding = async (params: any = {}) => {
    const response = await apiClient.get('/borrower/funding', { params });
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

export const fetchFundingRequestDocuments = async (fundingApplicationId: string | number) => {
    const response = await apiClient.get(`/borrower/funding-application/documents/${fundingApplicationId}`);
    return response.data;
};

export const deleteFundingRequestDocument = async (documentId: number) => {
    const response = await apiClient.delete(`/borrower/funding-application/documents/${documentId}`);
    return response.data;
};


