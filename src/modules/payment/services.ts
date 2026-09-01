import { apiClient } from '../../lib/http/apiClient';
import { PaymentResponse, PaymentParams } from './types';

const BASE_URL = '/borrower/payments';

export const fetchPayments = async (params: PaymentParams = {}): Promise<PaymentResponse> => {
    const { data } = await apiClient.post<PaymentResponse>(`${BASE_URL}/fetch-payments`, params);
    return data;
};

export const fetchPaymentDetail = async (id: string | number) => {
    const { data } = await apiClient.get(`${BASE_URL}/${id}`);
    return data;
};

export const approvePayment = async (id: string | number, payload: { note: string }) => {
    const { data } = await apiClient.post('/common/payments/' + id + '/approve', payload);
    return data;
};

export const rejectPayment = async (id: string | number, payload: { reason: string; note?: string }) => {
    const { data } = await apiClient.post('/common/payments/' + id + '/reject', payload);
    return data;
};
