export interface Payment {
    id: number;
    transaction_date: string;
    from: string;
    payment_type: string;
    company: string;
    details: string;
    invoice_id: string;
    transaction_id: string;
    amount: string | number;
    currency: string;
    status: string;
    borrower_id: number;
    partner_id: number;
    entity_id: string;
    entity_type: string;
    borrower_name: string;
    partner_name: string;
    created_at: string;
}

export interface PaymentStats {
    total_payments: number;
    completed: number;
    pending: number;
    failed: number;
}

export interface PaymentStatsResponse {
    status: boolean;
    data: PaymentStats;
}

export interface PaymentParams {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string | null;
    payee_id?: string | null;
    cycle?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    sort_field?: string;
    sort_order?: string;
    filters?: Record<string, any>;
}

export interface PaymentResponse {
    data: Payment[];
    meta?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    status: boolean;
    message?: string;
}
