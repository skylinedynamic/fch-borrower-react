export interface RoadmapStep {
  id: number;
  day: number;
  issuer: string;
  card_name: string;
  exposure: string;
  status: 'Completed' | 'Active' | 'Locked';
  why: string;
  approval_odds: string;
  hard_pull: string;
  requirements: string[];
  result: {
    status: 'Approved' | 'Pending' | 'Declined';
    limit: number;
    notes?: string;
  } | null;
}

export interface RoadmapCard {
  id: number;                   // sequence id
  sequence_order: number;
  credit_account_id: number;
  issuer: string;
  card_name: string;
  exposure: string;             // e.g. "$1,000 - $5,000"
  hard_pull: string;
  access_time: string;          // Morning | Evening | Anytime | Day
  access_day: number | null;
  access_day_time: string | null;
  why_this_card: string;
  requirements: string[];
  approval_odds: string | null;   // null when card already applied
  probability_status: boolean;  // false = card is locked
  reason_code?: string | null;
  minimum_fico_requirement?: number | null;
  maximum_utilization_threshold?: number | null;
  application_status?: string | null;
  reference_url?: string | null;
  access_time_detail?: { id: number; label: string; start?: number | null; end?: number | null; min_value?: number | null; max_value?: number | null; } | null;
  access_day_time_detail?: { id: number; label: string; start?: number | null; end?: number | null; min_value?: number | null; max_value?: number | null; } | null;
}

export interface CapitalAccessStrategyRoadmap {
  id: number;
  name: string;
  approval_status?: boolean;    // false = whole strategy locked
  reason_code?: string | null;
  target_exposure: string;
  est_timeline: string;
  first_submitted_at?: string | null;
  roadmap: RoadmapCard[];
}

export interface CapitalAccessStepDetail {
  id: number;
  sequence_order: number;
  credit_account_id: number;
  issuer: string;
  card_name: string;
  exposure: string;
  est_limit_min: number | null;
  est_limit_max: number | null;
  hard_pull: string;
  access_time: string;
  access_day: number | null;
  access_day_time: string | null;
  why_this_card: string;
  requirements: string[];
  approval_odds: string | null;  // null when card already applied
  probability_status: boolean;
  play: {
    id: number;
    name: string;
    target_exposure: string;
  };
  application?: {
    id: number;
    credit_limit: string | null;
    notes: string | null;
    status: string;
  } | null;
  reference_url?: string | null;
  image_url?: string | null;
  full_image_url?: string | null;
}

export interface CapitalAccessStrategy {
  id: number;
  name: string;
  description: string;
  isRecommended: boolean;
  target_exposure: string;    // e.g. "$5,000 - $55,000"
  est_timeline: string;       // e.g. "11 - 16 days"
  approval_probability: string; // e.g. "95%"
  benefits: string[];
  checklist: Array<{ id: string; label: string; complete: boolean }>;
  roadmap: RoadmapStep[];
}

export interface CapitalAccessStrategyOverview {
  id: number;
  name: string;
  description: string;
  isRecommended: boolean;
  target_exposure: string;
  est_timeline: string;
  approval_probability: string;
  approval_status: boolean;
  reason_code: string | null;
  benefits: string[];
}

export interface CapitalAccessStrategyChecklist {
  id: number;
  name: string;
  approval_status: boolean;
  reason_code: string | null;
  checklist: Array<{ id: string; label: string; complete: boolean }>;
}

export interface StrategiesResponse {
  status: boolean;
  message: string;
  data: any[]; // raw data from API to be mapped in service
}

export interface StrategyDetailResponse {
  status: boolean;
  message: string;
  data: any; // raw data from API to be mapped in service
}

export interface FactorDetail {
  slug: string;
  label: string;
  value: string | number;
  weighted_score: number;
  raw_score: number;
}

export interface ExposureBreakdownItem {
  name: string;
  max_exposure: number;
}

export interface CapitalAccessOverview {
  readiness_score: number;
  readiness_status: string;
  readiness_status_color?: string;
  factors: FactorDetail[];
  estimated_total_access: string;
  exposure_breakdown?: ExposureBreakdownItem[];
  current_play?: { id: number; name: string; } | null;
}

export interface OverviewResponse {
  status: boolean;
  message: string;
  data: CapitalAccessOverview;
}
