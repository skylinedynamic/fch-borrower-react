import {
  CREDIT_AUTHORIZATION_TEXT,
  CREDIT_AUTHORIZATION_URLS,
  E_CONSENT_LINK_TEXT,
  E_CONSENT_TEXT_AFTER,
  E_CONSENT_TEXT_BEFORE,
  PREQUALIFICATION_NOTICE_BODY,
  PREQUALIFICATION_NOTICE_LABEL,
} from '../../config/creditAuthorization'

export interface CreditAuthorizationValues {
  credit_authorization_accepted: boolean
  e_consent_accepted: boolean
}

interface Props {
  values: CreditAuthorizationValues
  onChange: (values: CreditAuthorizationValues) => void
  /** Prefix for the input ids, so two of these can coexist on one page. */
  idPrefix?: string
  disabled?: boolean
  /** Server-side message, shown when the API refused for want of consent. */
  error?: string
}

/**
 * The authorisation a client gives before we pull their credit.
 *
 * This replaced a one-line notice saying "by submitting, you authorize a soft
 * credit inquiry". That was not consent anyone could prove: it required no act
 * from the client and left nothing behind. Under the FCRA a report may only be
 * pulled on the consumer's written instructions, and iSoftPull can ask us months
 * later to produce them.
 *
 * Two boxes, not one, because the FCRA authorisation and the E-SIGN consent are
 * legally distinct - bundled together, neither can be shown to have been given.
 * Both start unticked; a pre-ticked box is not agreement.
 *
 * Ticking is only half of it. The API refuses the request without both, and
 * writes the wording, version, time, IP and user agent into a record - see
 * CreditAuthorizationConsentService there. This component is the part the client
 * sees, not the part that proves anything.
 */
export default function CreditAuthorizationConsent({
  values,
  onChange,
  idPrefix = 'credit-auth',
  disabled = false,
  error,
}: Props) {
  const authId = `${idPrefix}-authorization`
  const consentId = `${idPrefix}-e-consent`

  return (
    <div className="mb-4">
      <div className={`border rounded p-3 ${error ? 'border-danger' : ''}`}>
        {/* ── 1. FCRA credit authorisation ── */}
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id={authId}
            checked={values.credit_authorization_accepted}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...values, credit_authorization_accepted: e.target.checked })
            }
          />
          <label className="form-check-label fs-13" htmlFor={authId}>
            <span className="fw-semibold d-block mb-1">Credit Authorization</span>
            {CREDIT_AUTHORIZATION_TEXT}
          </label>
          {/* Not required to agree - the full wording is above. It is here so a
              client can read the published version, with its effective date,
              before ticking. */}
          <div className="mt-1">
            <a
              href={CREDIT_AUTHORIZATION_URLS.authorization}
              target="_blank"
              rel="noopener noreferrer"
              className="fs-12"
            >
              What this means
            </a>
          </div>
        </div>

        {/* ── 2. E-SIGN consent ── */}
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id={consentId}
            checked={values.e_consent_accepted}
            disabled={disabled}
            onChange={(e) => onChange({ ...values, e_consent_accepted: e.target.checked })}
          />
          <label className="form-check-label fs-13" htmlFor={consentId}>
            <span className="fw-semibold d-block mb-1">Electronic Communications Consent</span>
            {E_CONSENT_TEXT_BEFORE}
            <a
              href={CREDIT_AUTHORIZATION_URLS.eConsent}
              target="_blank"
              rel="noopener noreferrer"
            >
              {E_CONSENT_LINK_TEXT}
            </a>
            {E_CONSENT_TEXT_AFTER}
          </label>
        </div>
      </div>

      {error && <div className="text-danger fs-12 mt-1">{error}</div>}

      {/* ── Information only. No checkbox: nothing is being agreed to here.
          It still has to be read, though - it is the limit of what a
          prequalification means. It was alert-light at fs-12, which put pale
          small text on a pale background and made it easy to miss entirely, so
          it now carries an accent bar, an icon and body-sized dark text. ── */}
      <div
        className="p-3 mt-3 mb-2 rounded bg-warning-subtle fs-13 text-dark"
        style={{ borderLeft: '4px solid var(--vz-warning, #d4af37)' }}
        role="note"
      >
        <span className="fw-bold d-block mb-1">{PREQUALIFICATION_NOTICE_LABEL}</span>
        {PREQUALIFICATION_NOTICE_BODY}
      </div>

      <div className="fs-12 text-muted">
        <a href={CREDIT_AUTHORIZATION_URLS.privacy} target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>
        <span className="mx-2">·</span>
        <a href={CREDIT_AUTHORIZATION_URLS.terms} target="_blank" rel="noopener noreferrer">
          Terms of Use
        </a>
      </div>
    </div>
  )
}
