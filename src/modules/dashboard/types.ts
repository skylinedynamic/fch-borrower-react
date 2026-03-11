export interface DashboardStats {
    funding_applications: number;
    pre_qualifications: number;
    total_requested_amount: number;
    total_funded_amount: number;
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

export interface DashboardData {
    states: DashboardStats;
    latest_funding_applications: FundingApplication[];
    latest_pre_qualifications: PreQualification[];
    upcoming_meeting: Meeting[];
    invoices: DashboardInvoice[];
    tier: Tier
}

export interface DashboardResponse {
    status: boolean;
    message: string;
    data: DashboardData;
}
