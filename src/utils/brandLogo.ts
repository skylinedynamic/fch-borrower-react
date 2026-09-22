/**
 * Choosing which logo to paint on a surface.
 *
 * The API resolves an unset logo differently per tenant, and the split matters:
 * the host falls back to the packaged file below, while every other tenant falls
 * back to a placeholder carrying its own company name. Handing a white-label
 * portal the host's logo is the one fallback that is never acceptable — it puts
 * another company's mark on a portal whose whole purpose is that the host is
 * invisible — so the decision is made server-side, in
 * AppConfigurationService::getBrandingSettings(), and nothing here needs to know
 * which tenant it is looking at.
 */
import defaultLogo from '../../assets/images/fch-logo-wide.png';

/** The logo shown when a tenant entitled to it has uploaded none. */
export const DEFAULT_BRAND_LOGO: string = defaultLogo;

/**
 * An unset key arrives as the string "null", not as null, so a plain `||` chain
 * used to hand <img> a src of "null" and render a broken-image icon.
 */
export const isUsableLogo = (url?: string | null): boolean =>
    typeof url === 'string' && url.trim() !== '' && url !== 'null' && url !== 'undefined';

/** The first usable URL, or null when a caller wants to render text instead. */
export const pickLogo = (...urls: Array<string | null | undefined>): string | null =>
    urls.find(isUsableLogo) ?? null;

/** The first usable URL, falling back to the packaged default. */
export const resolveBrandLogo = (...urls: Array<string | null | undefined>): string =>
    pickLogo(...urls) ?? DEFAULT_BRAND_LOGO;
