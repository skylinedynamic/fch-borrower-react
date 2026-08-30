import { useQuery } from '@tanstack/react-query';
import { fetchCreditAccounts, fetchCreditAccountFilters } from './services';
import { CreditAccountFilters } from './types';

export const useCreditAccounts = (filters: CreditAccountFilters = {}, options: any = {}) => {
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
