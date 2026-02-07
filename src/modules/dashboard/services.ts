import { apiClient } from '../../lib/http/apiClient';
import { DashboardResponse } from './types';

const BASE_URL = '/borrower/dashboard';

export const fetchDashboardData = async (): Promise<DashboardResponse> => {
    const { data } = await apiClient.get<DashboardResponse>(BASE_URL);
    return data;
};
