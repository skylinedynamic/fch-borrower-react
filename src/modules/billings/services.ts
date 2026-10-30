import { apiClient } from '../../lib/http/apiClient';
import { BillingDetailsData } from './types';

export interface PaymentProviderItem {
  id: number;
  name: string;
  display_name: string;
  logo?: string | null;
  publishable_key?: string | null;
  // Backend (PartnerPaymentProviderResource) always casts this to a real boolean.
  status?: boolean;
  /** Switched on and set up for its mode (e.g. Stripe with usable keys) - what Pay Now offers too (BUG-151). */
  can_take_payments?: boolean;
}

export const fetchBillingDetails = async (): Promise<BillingDetailsData> => {
  const { data } = await apiClient.get<{ data?: BillingDetailsData } & BillingDetailsData>('/borrower/billing-details');
  return data?.data || data;
};

export const fetchPaymentProviders = async (): Promise<PaymentProviderItem[]> => {
  const { data } = await apiClient.get('/common/partner-payment-providers');
  return data?.data || data;
};

export const updateDefaultPaymentMethod = async (payload: { provider_name: string; payment_method_id?: string }): Promise<any> => {
  const { data } = await apiClient.post('/borrower/update-default-payment-method', payload);
  return data?.data || data;
};

/** Takes the default payment method off; nothing is auto-charged until one is set again. */
export const removeDefaultPaymentMethod = async (): Promise<any> => {
  const { data } = await apiClient.post('/borrower/remove-default-payment-method');
  return data?.data || data;
};

export const cancelBorrowerSubscription = async (): Promise<any> => {
  const { data } = await apiClient.post('/borrower/cancel-subscription');
  return data?.data || data;
};
