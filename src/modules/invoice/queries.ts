import { useQuery } from '@tanstack/react-query';
import { fetchInvoices, fetchUnpaidInvoices } from './services';
import { InvoiceParams } from './types';

export const useInvoices = (params: InvoiceParams = {}) => {
    return useQuery({
        queryKey: ['invoices', params],
        queryFn: () => fetchInvoices(params),
    });
};

export const useUnpaidInvoices = (enabled: boolean = true) => {
    return useQuery({
        queryKey: ['unpaid-invoices'],
        queryFn: fetchUnpaidInvoices,
        enabled,
        staleTime: 0, // Always fetch fresh data
    });
};
