export interface CreditAccount {
    id: number;
    card_name: string;
    issuer: string;
    credit_category: string;
    difficulty_rank: number;
    difficulty_tier: string;
    engine_eligibility_band: string;
    approval_level: string;
    typical_personal_fico_min: number | null;
    typical_personal_fico_ideal: number | null;
    time_in_business_min_months: number;
    revenue_expectation: string;
    business_credit_required: string;
    pg_required: string;
    cash_based: string;
    velocity_sensitive: string;
    relationship_required: string;
    internal_notes: string;
    portal_tier_unlock: string;
    borrower_exposure: string;
    sequencing_priority: string | null;
    image_url: string;
    reference_url: string;
    status?: 'Requested' | 'Processing' | 'Approved';
    created_at: string;
    updated_at: string;
}

export interface CreditAccountFilters {
    tier?: string;
    category?: string;
    bureau?: string;
    q?: string;
    page?: number;
    issuer?: string;
}

export interface CreditAccountFilterOptions {
    categories: string[];
    issuers: string[];
    application_statuses: string[];
}

export interface CreditAccountFilterResponse {
    status: boolean;
    message: string;
    data: CreditAccountFilterOptions;
}

export interface CreditAccountResponse {
    data: CreditAccount[];
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
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
    message?: string;
    status?: boolean;
}
