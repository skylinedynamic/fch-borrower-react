import { apiClient } from '../../lib/http/apiClient';
import type { ApplyCreditAccountResponse, CreditAccountFilters, CreditAccountResponse, CreditAccountFilterResponse } from './types';

const BASE_URL = '/borrower/credit-builder/credit-accounts';

export const fetchCreditAccounts = async (params: CreditAccountFilters = {}): Promise<CreditAccountResponse> => {
    const { data } = await apiClient.post<CreditAccountResponse>(BASE_URL, params);
    return data;
};

export const fetchCreditAccountFilters = async (): Promise<CreditAccountFilterResponse> => {
    const { data } = await apiClient.get<CreditAccountFilterResponse>(`${BASE_URL}/filter-options`);
    return data;
};

export const applyForCreditAccount = async (id: number, status?: string): Promise<ApplyCreditAccountResponse> => {
    const { data } = await apiClient.post<ApplyCreditAccountResponse>(`${BASE_URL}/${id}/apply`, { status });
    return data;
};
