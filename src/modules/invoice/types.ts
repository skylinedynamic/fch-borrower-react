export interface InvoicePartner {
    id: number;
    name: string;
}

export interface Invoice {
    id: number;
    invoice_id: string;
    borrower_id: number;
    entity_type: string;
    entity_id: number;
    customer_name: string;
    email: string;
    country: string;
    payment_amount: number | string;
    payment_date: string;
    status: string;
    cycle: string;
    details: string;
    created_at: string;
    updated_at: string;
    partner?: InvoicePartner;
}

export interface InvoiceStatsData {
    invoices_sent: number;
    paid_invoices: number;
    unpaid_invoices: number;
    collection_rate: number;
}

export interface InvoiceStatsResponse {
    status: boolean;
    message?: string;
    data: InvoiceStatsData;
}

export interface InvoiceParams {
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

export interface InvoiceResponse {
    data: Invoice[];
    links?: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta?: {
        current_page: number;
        from: number;
        last_page: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
    status: boolean;
    message?: string;
}

export interface PaymentPayload {
    amount: number;
    currency: string;
    payment_method_id: string;
    description?: string;
    invoice_id?: number | string;
    entity_id?: number | string;
    entity_type?: string;
}

export interface PaymentResponse {
    status: boolean;
    message?: string;
    data?: {
        id: string;
        payment_intent_id?: string;
        status: string;
        amount: number;
        currency: string;
    };
}

export interface UnpaidInvoice {
    id: number;
    invoice_id: string;
    borrower_id: number;
    entity_type: string;
    entity_id: number;
    customer_name: string;
    email: string;
    country: string;
    payment_amount: number | string;
    payment_date: string;
    status: string;
    cycle: string;
    details: string;
}

export interface UnpaidInvoiceResponse {
    status: boolean;
    message?: string;
    data: UnpaidInvoice[];
}
