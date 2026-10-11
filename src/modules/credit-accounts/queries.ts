import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { fetchCreditAccounts, fetchCreditAccountFilters } from './services';
import { CreditAccountFilters, CreditAccountResponse } from './types';

export const useCreditAccounts = (
    filters: CreditAccountFilters = {},
    options: Partial<UseQueryOptions<CreditAccountResponse>> = {}
) => {
    return useQuery({
        queryKey: ['credit-accounts', filters],
        queryFn: () => fetchCreditAccounts(filters),
        ...options
    });
};

export const useCreditAccountFilters = () => {
    return useQuery({
        queryKey: ['credit-account-filters'],
        queryFn: () => fetchCreditAccountFilters(),
        staleTime: 0,
        gcTime: 0,
    });
};
