import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { applyForCreditAccount, fetchCreditAccounts, fetchCreditAccountFilters } from './services';
import type { ApplyCreditAccountPayload, CreditAccountFilters, CreditAccountResponse } from './types';

export const creditAccountKeys = {
    all: ['credit-accounts'] as const,
    list: (filters: CreditAccountFilters) => ['credit-accounts', filters] as const,
    filters: ['credit-account-filters'] as const,
};

export const useCreditAccounts = (
    filters: CreditAccountFilters = {},
    options: Partial<UseQueryOptions<CreditAccountResponse>> = {}
) => {
    return useQuery({
        queryKey: creditAccountKeys.list(filters),
        queryFn: () => fetchCreditAccounts(filters),
        ...options
    });
};

export const useCreditAccountFilters = () => {
    return useQuery({
        queryKey: creditAccountKeys.filters,
        queryFn: () => fetchCreditAccountFilters(),
        staleTime: 0,
        gcTime: 0,
    });
};

/**
 * The borrower marks where their application with a vendor stands. Any status
 * from any other, by design (BUG-028) - see creditAccountStatusOptions.ts.
 */
export const useApplyForCreditAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: ApplyCreditAccountPayload) => applyForCreditAccount(id, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: creditAccountKeys.all }),
    });
};
