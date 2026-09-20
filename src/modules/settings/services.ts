import { apiClient } from '../../lib/http/apiClient';
import type { BorrowerThemeResponse } from './types';

export const fetchBorrowerTheme = async (): Promise<BorrowerThemeResponse> => {
    const { data } = await apiClient.get<BorrowerThemeResponse>('/borrower/borrower-theme');
    return data;
};
