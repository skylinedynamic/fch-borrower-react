import { useMutation, useQuery } from '@tanstack/react-query';
import { confirmAuthenticatedPayment, fetchInvoices, fetchUnpaidInvoices, processUnifiedPayment } from './services';
import { InvoiceParams, ProcessPaymentPayload } from './types';

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

/** Pay an invoice. A 3-D Secure card answers with `requires_action` - see useConfirmAuthenticatedPayment. */
export const useProcessPayment = () => {
    return useMutation({
        mutationFn: (payload: ProcessPaymentPayload) => processUnifiedPayment(payload),
    });
};

/** Settle a card payment once the payer has done the bank's 3-D Secure challenge. */
export const useConfirmAuthenticatedPayment = () => {
    return useMutation({
        mutationFn: (paymentId: number) => confirmAuthenticatedPayment(paymentId),
    });
};
