export interface InvoicePartner {
    id: number;
    name: string;
}

/**
 * One side of an invoice - who issued it (billed_from) or who pays it
 * (billed_to). Same shape whatever kind of account is behind it.
 */
export interface InvoiceParty {
    name: string | null;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
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
    // Only on the invoice detail response.
    billed_from?: InvoiceParty;
    billed_to?: InvoiceParty;
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
    stats?: InvoiceStatsData;
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

export interface ProcessPaymentPayload {
    payment_token: string;
    invoice_id: number | string;
    payment_method_id: number;
    bank_detail_id?: number | string;
}

/**
 * What the API answers for a payment attempt or its confirmation. A card whose
 * bank wants 3-D Secure comes back with `requires_action` and the
 * `client_secret` Stripe.js needs to run the bank's challenge (BUG-066); the
 * payment then stays `pending` until confirmAuthenticatedPayment settles it.
 */
export interface ProcessPaymentResult {
    success: boolean;
    payment_id?: number;
    transaction_id?: string;
    status: string;
    requires_action?: boolean;
    client_secret?: string;
    message?: string | null;
}

export interface ProcessPaymentResponse {
    status: boolean;
    message?: string;
    data?: ProcessPaymentResult;
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
