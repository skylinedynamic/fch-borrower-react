import { apiClient } from '../../lib/http/apiClient';
import { InvoiceResponse, InvoiceStatsResponse, InvoiceParams, PaymentPayload, PaymentResponse, UnpaidInvoiceResponse } from './types';

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
    const { data } = await apiClient.get('/payment/partner-payment-methods');
    return data;
};

export const processUnifiedPayment = async (payload: { payment_token: string; invoice_id: number | string; payment_method_id: number; bank_detail_id?: number | string }) => {
    const response = await apiClient.post('/borrower/process-payment', payload);
    return response.data;
};
