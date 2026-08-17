import { apiClient } from '../../lib/http/apiClient';

export const fetchBorrowerTheme = async (): Promise<any> => {
    const { data } = await apiClient.get('/borrower/borrower-theme');
    return data;
};
