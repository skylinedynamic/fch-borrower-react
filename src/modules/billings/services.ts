import { apiClient } from '../../lib/http/apiClient';
import { BillingDetailsData } from './types';

export const fetchBillingDetails = async (): Promise<BillingDetailsData> => {
  const { data } = await apiClient.get<{ data?: BillingDetailsData } & BillingDetailsData>('/borrower/billing-details');
  return data?.data || data;
};
