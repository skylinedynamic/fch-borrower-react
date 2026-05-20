import { apiClient } from '../../lib/http/apiClient';
import type { SettingsResponse } from './types';

export const fetchSettings = async (): Promise<SettingsResponse> => {
    const { data } = await apiClient.get('/borrower/payment-methods');
    return data;
};

export const fetchBorrowerTheme = async (): Promise<any> => {
    const { data } = await apiClient.get('/borrower/borrower-theme');
    return data;
};
