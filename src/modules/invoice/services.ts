import { apiClient } from '../../lib/http/apiClient';
import { InvoiceResponse, InvoiceStatsResponse, InvoiceParams, PaymentPayload, PaymentResponse, ProcessPaymentPayload, ProcessPaymentResponse, UnpaidInvoiceResponse } from './types';

const BASE_URL = '/borrower/invoice';

export const fetchInvoices = async (params: InvoiceParams = {}): Promise<InvoiceResponse> => {
    const { data } = await apiClient.post<InvoiceResponse>(BASE_URL, params);
    // Add status: true if not present but data exists, for frontend compatibility
    return {
        ...data,
        status: data.status ?? (Array.isArray(data.data) ? true : false)
    };
};


export const fetchUnpaidInvoices = async (): Promise<UnpaidInvoiceResponse> => {
    const { data } = await apiClient.get<UnpaidInvoiceResponse>('/borrower/invoice/check-unpaid-invoice');
    return data;
};

export const fetchInvoiceDetails = async (id: string | number) => {
    const { data } = await apiClient.get(`/borrower/invoice/${id}`);
    return data;
};

export const downloadInvoice = async (id: string | number) => {
    const { data } = await apiClient.get(`/borrower/invoice/${id}/download`);
    return data;
};

export const sendInvoice = async (id: string | number) => {
    const { data } = await apiClient.post(`/common/invoices/${id}/send`);
    return data;
};

export const fetchPartnerPaymentMethods = async () => {
    const { data } = await apiClient.get('/payment/get-payment-methods');
    return data;
};

export const processUnifiedPayment = async (payload: ProcessPaymentPayload): Promise<ProcessPaymentResponse> => {
    const response = await apiClient.post<ProcessPaymentResponse>('/borrower/process-payment', payload);
    return response.data;
};

/**
 * Finish a card payment after the bank's 3-D Secure challenge. Only the
 * payment id is sent: the API reads the outcome from Stripe itself.
 */
export const confirmAuthenticatedPayment = async (paymentId: number): Promise<ProcessPaymentResponse> => {
    const response = await apiClient.post<ProcessPaymentResponse>('/borrower/process-payment/confirm', { payment_id: paymentId });
    return response.data;
};
