import { useQuery } from '@tanstack/react-query';
import { fetchCreditAccounts, fetchCreditAccountFilters } from './services';
import { CreditAccountFilters } from './types';

export const useCreditAccounts = (filters: CreditAccountFilters = {}) => {
    return useQuery({
        queryKey: ['credit-accounts', filters],
        queryFn: () => fetchCreditAccounts(filters),
    });
};

export const useCreditAccountFilters = () => {
    return useQuery({
        queryKey: ['credit-account-filters'],
        queryFn: () => fetchCreditAccountFilters(),
    });
};
