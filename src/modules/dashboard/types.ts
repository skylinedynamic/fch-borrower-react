export interface DashboardStats {
    funding_applications: number;
    /** Funding requests that weren't canceled. */
    funding_requests: number;
    pre_qualifications: number;
    total_requested_amount: number;
    total_funded_amount: number;
    /** As the top cards show them, formatted by the API: "$37.2M", "$45K". */
    total_requested_amount_formatted: string;
    total_funded_amount_formatted: string;
}

export interface FundingApplication {
    id: number;
    requested_amount: string | null;
    entity_type: string | null;
    industry_type: string | null;
    status: string;
    status_class: string;
    purpose_of_funds: string | null;
    total_funded_amount: string | null;
    currency: string;
    currency_symbol: string;
    conversion_rate: string;
    created_at: string;
    formatted_created_at: string;
}

export interface PreQualification {
    id: number;
    purpose_of_funding: string | null;
    industry_type: string | null;
    business_structure: string | null;
    funding_requested_amount: string | null;
    status: string;
    status_class: string;
    created_at: string;
    formatted_created_at: string;
}

export interface Meeting {
    id: number;
    subject: string;
    status: string;
    appointment_date: string;
    meeting_type: string;
    formatted_appointment_date: string;
    scheduled_by: any;
    assigned_for: any;
}

export interface DashboardInvoice {
    id: number;
    invoice_id: string;
    status: string;
    status_class?: string;
    payment_amount: string;
    payment_date: string;
    currency: string;
    currency_symbol: string;
    conversion_rate: string;
    created_at: string;
    formatted_created_at: string;
}

export interface Tier {
    id: number;
    name: string;
    title: string;
    tasks_under_review: number;
}

/** An approved funding request no application has been started for. */
export interface ActiveFundingRequest {
    id: number;
    requested_amount: string | number | null;
    estimated_funding_range: string | null;
    funding_type: string | null;
}

export interface ActiveFundingRequestsData {
    active_approved_funding_requests: ActiveFundingRequest[];
    /** The latest of them, or null when there are none. */
    active_approved_funding_request: ActiveFundingRequest | null;
    active_approved_funding_request_count: number;
}

export interface ActiveFundingRequestsResponse {
    status: boolean;
    message: string;
    data: ActiveFundingRequestsData;
}

/** Without the active funding requests: those come from fetchActiveFundingRequests(). */
export interface DashboardData {
    states: DashboardStats;
    latest_funding_applications: FundingApplication[];
    latest_pre_qualifications: PreQualification[];
    upcoming_meeting: Meeting[];
    invoices: DashboardInvoice[];
    tier: Tier | null;
    /** Null until the borrower's credit profile has been verified. */
    fico_score?: number | string | null;
}

export interface DashboardResponse {
    status: boolean;
    message: string;
    data: DashboardData;
}
