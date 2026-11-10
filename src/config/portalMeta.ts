/**
 * What the borrower portal's <head> says about it - the same wording the API's
 * /api/portal-meta gives Nginx for the raw HTML (App\Support\Branding\PortalMeta)
 * and the stub in index.html. Change all three together.
 */
export const PORTAL_LABEL = 'Borrower Portal'

export const DEFAULT_SITE_NAME = 'Four Corner Funding'

export const portalDescription = (siteName: string): string =>
  `Sign in to the ${siteName} borrower portal to apply for funding and track your applications.`

/** localStorage key of the domain's public branding, cached by the login page (Layout/Auth). */
export const PUBLIC_BRANDING_STORAGE_KEY = 'public_branding'
