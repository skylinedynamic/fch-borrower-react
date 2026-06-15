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

export interface CapitalAccessOverview {
  readiness_score: number;
  readiness_status: string;
  score_labels_top: { min: number; max: number };
  score_labels_bottom: { min: number; max: number };
  contributing_factors: string[];
  estimated_total_access: string;
  breakdown: Array<{ label: string; value: string }>;
}

export interface OverviewResponse {
  status: boolean;
  message: string;
  data: CapitalAccessOverview;
}
