import type { BrandingConfig } from '../../store/brandingStore';

// Shape returned by GET /borrower/borrower-theme (CommonController::getTheme).
// When authenticated, branding is nested with status flags; when a guest,
// the branding fields are returned directly as `data`.
export interface BorrowerThemeStatusFlags {
  is_fresh_email: boolean | null;
  is_fresh_settings: boolean | null;
  is_fresh_site_settings: boolean | null;
  is_fresh_payment: boolean | null;
}

export interface AuthenticatedBorrowerThemeData {
  branding: BrandingConfig;
  status_flags: BorrowerThemeStatusFlags;
}

export type BorrowerThemeData = AuthenticatedBorrowerThemeData | BrandingConfig;

export interface BorrowerThemeResponse {
  status: boolean;
  message: string;
  data: BorrowerThemeData;
}
