import { apiClient } from '../../lib/http/apiClient';
import type { SettingsResponse } from './types';

// Base API path
const BASE_PATH = '/borrower/settings';

export const fetchSettings = async (): Promise<SettingsResponse> => {
    const { data } = await apiClient.get(BASE_PATH);
    return data;
};
