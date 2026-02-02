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

export const fetchInvoiceStats = async (params: InvoiceParams = {}): Promise<InvoiceStatsResponse> => {
    try {
        const { data } = await apiClient.post<InvoiceStatsResponse>(`${BASE_URL}/stats`, params);
        return data;
    } catch (e) {
        console.warn('Failed to fetch invoice stats, using placeholders', e);
        return {
            status: false,
            data: {
                invoices_sent: 0,
                paid_invoices: 0,
                unpaid_invoices: 0,
                collection_rate: 0
            }
        };
    }
};

export const processInvoicePayment = async (payload: PaymentPayload): Promise<PaymentResponse> => {
    const { data } = await apiClient.post<PaymentResponse>(`${BASE_URL}/payment`, payload);
    return data;
};

export const fetchUnpaidInvoices = async (): Promise<UnpaidInvoiceResponse> => {
    const { data } = await apiClient.get<UnpaidInvoiceResponse>('/borrower/invoice/check-unpaid-invoice');
    return data;
};
