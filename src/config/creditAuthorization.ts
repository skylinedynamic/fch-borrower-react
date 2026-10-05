/**
 * The FCRA credit authorisation and E-SIGN consent shown before a credit pull.
 *
 * These strings are what the client actually reads, so they are kept here rather
 * than inline in the form - the same wording, version and links also live in the
 * API's config/credit_authorization.php, which is what gets copied into the
 * stored record. The two must stay in step: the record is the evidence, and this
 * is what produced it.
 *
 * CHANGING THE WORDING: a new version is published on fourcornerholdings.com and
 * the version string is bumped in BOTH places. Existing text is never edited -
 * stored records point at a version that has to remain resolvable against the
 * version history on the published page.
 */
export const CREDIT_AUTHORIZATION_VERSION = '1.0'

export const CREDIT_AUTHORIZATION_URLS = {
  /** Permanent public copy of the authorisation wording below. */
  authorization: 'https://fourcornerholdings.com/credit-authorization',
  /** The document behind checkbox 2. NOT /disclosures, which is not a consent document. */
  eConsent: 'https://fourcornerholdings.com/e-consent',
  privacy: 'https://fourcornerholdings.com/privacy',
  terms: 'https://fourcornerholdings.com/terms',
} as const

/** Checkbox 1 - the FCRA authorisation itself. */
export const CREDIT_AUTHORIZATION_TEXT =
  'You understand that by clicking "Submit" immediately following this notice, you are providing "written instructions" under the Fair Credit Reporting Act, authorizing Four Corner Holdings, LLC to obtain information from your personal credit profile and other information from Equifax, TransUnion, and/or Experian to conduct a prequalification for credit. This process will not affect your credit score. You also give permission for your contact information to be provided to a third-party lender, if applicable.'

/**
 * Checkbox 2 - E-SIGN consent. Legally separate from the authorisation above,
 * which is why it is its own checkbox and its own stored field.
 *
 * Split so "Electronic Disclosures and Communications" can be a link without
 * putting markup in the stored wording.
 */
export const E_CONSENT_TEXT_BEFORE = 'I certify that I have read and agree to the '
export const E_CONSENT_LINK_TEXT = 'Electronic Disclosures and Communications'
export const E_CONSENT_TEXT_AFTER = '.'

/**
 * Information only - nothing is agreed to here, so it carries no checkbox.
 *
 * Split into label and body so the label can be emphasised without putting
 * markup in the string. The whole sentence is kept as well, because the API's
 * config/credit_authorization.php holds the same notice as one string and the
 * two are meant to read identically.
 */
export const PREQUALIFICATION_NOTICE_LABEL = 'Prequalification Notice'

export const PREQUALIFICATION_NOTICE_BODY =
  'This credit review is for preliminary evaluation purposes only. It does not constitute an application approval, offer of credit, financing commitment, or guarantee of funding.'

export const PREQUALIFICATION_NOTICE = `${PREQUALIFICATION_NOTICE_LABEL}: ${PREQUALIFICATION_NOTICE_BODY}`
