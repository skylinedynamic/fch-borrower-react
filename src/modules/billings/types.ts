export interface RecentBill {
  id: number;
  invoice_id: string;
  amount: number;
  status: string;
  type?: string;
  created_at?: string;
}

export interface UpcomingBilling {
  next_date: string | null;
  amount: number;
  enrollment_type: string;
  status: string;
}

export interface BorrowerInfo {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  stripe_customer_id?: string | null;
  default_payment_method?: string | null;
  partner_payment_for_me?: boolean;
}

export interface SubscriptionInfo {
  id: number;
  enrollment_type?: string;
  status?: string;
  total_subscription_amount?: number;
  payable_amount?: number;
  down_payment?: number;
  installment_count?: number;
  subscription_start_date?: string;
  subscription_end_date?: string;
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
