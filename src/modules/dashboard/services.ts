import { apiClient } from '../../lib/http/apiClient';
import { ActiveFundingRequestsResponse, DashboardResponse } from './types';

const BASE_URL = '/borrower/dashboard';

export const fetchDashboardData = async (): Promise<DashboardResponse> => {
    const { data } = await apiClient.get<DashboardResponse>(BASE_URL);
    return data;
};

export const fetchActiveFundingRequests = async (): Promise<ActiveFundingRequestsResponse> => {
    const { data } = await apiClient.get<ActiveFundingRequestsResponse>('/borrower/active-funding-requests');
    return data;
};
