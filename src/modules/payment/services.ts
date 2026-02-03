import { apiClient } from '../../lib/http/apiClient';
import { PaymentResponse, PaymentStatsResponse, PaymentParams } from './types';

const BASE_URL = '/borrower/payments';

export const fetchPayments = async (params: PaymentParams = {}): Promise<PaymentResponse> => {
    const { data } = await apiClient.post<PaymentResponse>(`${BASE_URL}/fetch-payments`, params);
    return data;
};

export const fetchPaymentStats = async (params: any = {}): Promise<PaymentStatsResponse> => {
    const { data } = await apiClient.post<PaymentStatsResponse>(`${BASE_URL}/stats`, params);
    return data;
};

export const fetchPaymentDetail = async (id: string | number) => {
    const { data } = await apiClient.get(`${BASE_URL}/${id}`);
    return data;
};
