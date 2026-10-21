export interface RecentBill {
  id: number;
  invoice_id: string;
  amount: number | string;
  status: string;
  type?: string;
  created_at?: string;
}

export interface UpcomingBilling {
  next_date: string | null;
  amount: number | string;
  enrollment_type: string;
  status: string;
}

export interface StripeCardInfo {
  customer_id?: string | null;
  name?: string | null;
  card_no?: string | null;
}

export interface BorrowerInfo {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  stripe_customer_id?: string | StripeCardInfo | null;
  stripe_card_info?: StripeCardInfo | null;
  default_payment_method?: string | null;
  partner_payment_for_me?: boolean;
  /** null once the default payment method was removed. */
  payment_provider?: {
    name: string;
    logo?: string | null;
  } | null;
}

export interface SubscriptionInfo {
  id: number;
  enrollment_type?: string;
  status?: string;
  total_subscription_amount?: number | string;
  payable_amount?: number | string;
  down_payment?: number | string;
  subscription_amount_per_month?: number | string;
  installment_count?: number;
  installments_paid?: number;
  subscription_start_date?: string;
  subscription_end_date?: string;
  enrollment_completed_at?: string;
  is_completed?: boolean;
}

export interface RecentPaymentItem {
  id: number;
  transaction_date?: string;
  created_at?: string;
  transaction_id?: string;
  invoice_no?: string;
  invoice_id?: string;
  payment_type?: string;
  from?: string;
  amount?: number;
  displayable_amount?: string;
  transaction_type?: string;
  status: string;
}

export interface BillingDetailsData {
  borrower?: BorrowerInfo;
  subscription?: SubscriptionInfo | null;
  recent_bill?: RecentBill | null;
  upcoming_billing?: UpcomingBilling;
  recent_payments?: RecentPaymentItem[];
}
