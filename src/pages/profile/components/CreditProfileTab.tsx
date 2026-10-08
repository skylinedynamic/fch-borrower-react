import React, { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_blue.css'
import { toast } from 'react-toastify'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { yearDropdownPlugin } from '../../../utils/flatpickrPlugins'
import { useAuth } from '../../../hooks/useAuth'
import { usePersonalInfo } from '../../../modules/profile'
import { countries } from '../../../modules/location'
import { apiClient } from '../../../lib/http/apiClient'
import { queryKeys } from '../../../lib/query'
import { formatPhoneNumber, formatZipCode, formatSSN, unformatSSN, maskSSN, formatDate } from '../../../utils/formatters'
import TabLoader from '../../../components/Loader/TabLoader'
import { fetchCreditProfile } from '../../../modules/credit-profile'
import type { CreditProfile, CreditProfileRequestData } from '../../../modules/credit-profile'
import type { AuthUser } from '../../../store/auth'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import CreditAuthorizationConsent, {
  type CreditAuthorizationValues,
} from '../../../components/CreditAuthorization/CreditAuthorizationConsent'
import CreditScoreHero from './CreditScoreHero'
import CreditAccountHealth from './CreditAccountHealth'
import CreditAccountsBreakdown from './CreditAccountsBreakdown'
import CreditIdentityPanel from './CreditIdentityPanel'

// Fields present on the auth user object that AuthUser's index signature otherwise
// types as `unknown` (AuthUser has no explicit first_name/last_name/phone_number).
type AuthUserProfileFields = AuthUser & {
  first_name?: string
  last_name?: string
  phone_number?: string
}

interface FormState {
  first_name: string
  middle_name: string
  last_name: string
  address: string
  apt_suite_other: string
  city: string
  state: string
  zip: string
  ssn: string
  date_of_birth: string
  phone: string
  email: string
}

// ─── Helper: read-only detail row ─────────────────────────────────────────────
interface DetailItemProps {
  label: string
  value: React.ReactNode
  icon?: string
}

const DetailItem = ({ label, value, icon }: DetailItemProps) => (
  <div className="d-flex align-items-start gap-3 py-2">
    {icon && (
      <div className="flex-shrink-0 text-muted">
        <i className={`${icon} fs-16`}></i>
      </div>
    )}
    <div className="flex-grow-1 min-w-0">
      <div className="text-muted fs-12 text-uppercase fw-medium mb-1" style={{ letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div className="fw-semibold text-dark fs-14">{value || <span className="text-muted fst-italic">—</span>}</div>
    </div>
  </div>
)

interface CreditProfileTabProps {
  /** Called once a credit profile request has been accepted, so the page can move the borrower on. */
  onSubmitted?: () => void
}

/** "Oct 8, 2026" from the API's timestamp; nothing when it is missing or unreadable. */
const formatSubmittedDate = (value?: string): string | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CreditProfileTab({ onSubmitted }: CreditProfileTabProps = {}) {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<CreditProfileRequestData | null>(null)
  const [creditProfile, setCreditProfile] = useState<CreditProfile | null>(null)
  // A request is on file but its credit pull has not come back yet.
  const [pendingRequest, setPendingRequest] = useState(false)
  const [showSSN, setShowSSN] = useState(false)
  // Set when the borrower resubmits: the form is long, so the notice at its
  // top is brought into view once it is back on screen.
  const [revealNotice, setRevealNotice] = useState(false)
  const noticeRef = useRef<HTMLDivElement>(null)

  const [updating, setUpdating] = useState(false)

  const { data: personalInfo } = usePersonalInfo()

  const [formData, setFormData] = useState<FormState>({
    first_name: '',
    middle_name: '',
    last_name: '',
    address: '',
    apt_suite_other: '',
    city: '',
    state: '',
    zip: '',
    ssn: '',
    date_of_birth: '',
    phone: '',
    email: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Both start unticked - a pre-ticked box is not agreement. Consent is per
  // request, so this resets with every new request rather than being remembered.
  const [consent, setConsent] = useState<CreditAuthorizationValues>({
    credit_authorization_accepted: false,
    e_consent_accepted: false,
  })
  const [updateConsent, setUpdateConsent] = useState<CreditAuthorizationValues>({
    credit_authorization_accepted: false,
    e_consent_accepted: false,
  })

  const bothConsentsGiven = consent.credit_authorization_accepted && consent.e_consent_accepted
  const bothUpdateConsentsGiven =
    updateConsent.credit_authorization_accepted && updateConsent.e_consent_accepted


  const usStates = countries.find(c => c.name === 'United States')?.states || []

  // Prefill from the profile the borrower has already filled in (Personal Info
  // tab), so they only check it and submit. Fills what is still empty, so it
  // never overwrites something typed, or the details of an earlier request that
  // arrive from the effects below. The full SSN isn't held, only its last four,
  // so that one is left for the borrower.
  useEffect(() => {
    const profile = personalInfo
    if (!profile) return
    setFormData(prev => ({
      ...prev,
      first_name: prev.first_name || profile.first_name || '',
      middle_name: prev.middle_name || profile.middle_name || '',
      last_name: prev.last_name || profile.last_name || '',
      address: prev.address || profile.home_address || '',
      city: prev.city || profile.city || '',
      state: prev.state || profile.state || '',
      zip: prev.zip || formatZipCode(profile.zip_code || ''),
      date_of_birth: prev.date_of_birth || (profile.date_of_birth ? profile.date_of_birth.substring(0, 10) : ''),
      phone: prev.phone || formatPhoneNumber(profile.phone_number || ''),
      email: prev.email || profile.email || '',
    }))
  }, [personalInfo])

  // Prefill from user personal info
  useEffect(() => {
    if (user) {
      const authUser = user as AuthUserProfileFields
      setFormData(prev => ({
        ...prev,
        first_name: authUser.first_name || prev.first_name,
        last_name: authUser.last_name || prev.last_name,
        email: authUser.email || prev.email,
        phone: authUser.phone_number || prev.phone,
      }))
    }
  }, [user])

  // Prefill from submitted data
  useEffect(() => {
    if (submittedData) {
      setFormData(prev => ({
        ...prev,
        first_name: submittedData.first_name || prev.first_name,
        middle_name: submittedData.middle_name || prev.middle_name,
        last_name: submittedData.last_name || prev.last_name,
        address: submittedData.address || prev.address,
        apt_suite_other: submittedData.apt_suite_other || prev.apt_suite_other,
        city: submittedData.city || prev.city,
        state: submittedData.state || prev.state,
        zip: submittedData.zip || prev.zip,
        ssn: submittedData.ssn || prev.ssn,
        date_of_birth: submittedData.date_of_birth ? submittedData.date_of_birth.substring(0, 10) : prev.date_of_birth,
        phone: submittedData.phone || prev.phone,
        email: submittedData.email || prev.email,
      }))
    }
  }, [submittedData])

  // If credit_profile_updated flag is set, fetch credit profile data.
  // If not, look for a request already submitted and awaiting its results, so
  // coming back to the tab shows it rather than an empty form.
  useEffect(() => {
    if (!user) return // still loading auth, or signed out: nothing to look up
    if (user.credit_profile_updated) {
      fetchCreditProfileOnly()
    } else {
      fetchSubmittedDetails({ quiet: true })
    }
  }, [user?.credit_profile_updated])

  const fetchCreditProfileOnly = async () => {
    try {
      setLoading(true)
      const data = await fetchCreditProfile()

      // If it doesn't have personal_info, it's the request data, not the actual profile.
      // We populate the form so the user can edit it.
      if (data && !data.personal_info) {
        setFormData(prev => ({
          ...prev,
          first_name: data.first_name || prev.first_name,
          middle_name: data.middle_name || prev.middle_name,
          last_name: data.last_name || prev.last_name,
          address: data.address || prev.address,
          apt_suite_other: data.apt_suite_other || prev.apt_suite_other,
          city: data.city || prev.city,
          state: data.state || prev.state,
          zip: data.zip || prev.zip,
          ssn: data.ssn || prev.ssn,
          date_of_birth: data.date_of_birth ? data.date_of_birth.substring(0, 10) : prev.date_of_birth,
          phone: data.phone || prev.phone,
          email: data.email || prev.email,
        }))
        setPendingRequest(true)
        setCreditProfile(null)
      } else {
        setCreditProfile(data)
      }
    } catch {
      setCreditProfile(null)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  /** `quiet`: on opening the tab, a failed lookup just leaves the form to fill in. */
  const fetchSubmittedDetails = async ({ quiet = false }: { quiet?: boolean } = {}) => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/borrower/profile/credit-profile-request')

      // API may return data: [] (empty array = not submitted) or data: {...} (object = submitted)
      const raw = data?.data
      if (Array.isArray(raw)) {
        // Empty array means no record exists yet — show the form
        setSubmittedData(raw.length > 0 ? (raw[0] as CreditProfileRequestData) : null)
      } else if (raw && typeof raw === 'object') {
        setSubmittedData(raw as CreditProfileRequestData)
      } else {
        setSubmittedData(null)
      }
    } catch (err: any) {
      console.error('Failed to fetch credit profile request details', err)
      setSubmittedData(null)
      if (!quiet) toast.error(
        err.response?.data?.message || 'Failed to load your credit profile details. Please try again.'
      )
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  /**
   * What the server's Ssn rule enforces, repeated here so a borrower hears about
   * a malformed number while the form is still in front of them rather than as a
   * 422 for the one field they cannot easily re-read off a screen.
   *
   * Nine digits is not enough to be an SSN: the SSA never issues area 000, 666 or
   * 900-999, group 00, or serial 0000. Kept in step with App\Rules\Ssn - a change
   * to one belongs in both.
   */
  const SSN_DIGITS = 9
  const ZIP_DIGITS = 5

  function ssnError(value: string): string | null {
    const digits = unformatSSN(value)

    if (digits.length !== SSN_DIGITS) {
      return 'Enter a valid 9-digit SSN as XXX-XX-XXXX.'
    }

    const area = digits.slice(0, 3)
    const group = digits.slice(3, 5)
    const serial = digits.slice(5)

    if (area === '000' || area === '666' || Number(area) >= 900 || group === '00' || serial === '0000') {
      return 'Enter a valid 9-digit SSN as XXX-XX-XXXX.'
    }

    return null
  }

  function zipError(value: string): string | null {
    return value.replace(/\D/g, '').length === ZIP_DIGITS
      ? null
      : 'Enter a 5-digit ZIP code, e.g. 10001.'
  }

  const update = (key: keyof FormState, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    // Clear the server error for this field as the user corrects it
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault()
    setErrors({})

    // Checked before anything is sent: this request triggers a credit pull, and
    // the two fields it is keyed on are the two worth being certain of.
    const clientErrors: Record<string, string> = {}
    const ssnProblem = ssnError(formData.ssn)
    const zipProblem = zipError(formData.zip)

    if (ssnProblem) clientErrors.ssn = ssnProblem
    if (zipProblem) clientErrors.zip = zipProblem

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    // Moving the borrower on (to the Step-By-Step Guide) is for the first
    // submission; editing and resubmitting a request already in stays here.
    const firstSubmission = !submittedData && !pendingRequest

    try {
      setSubmitting(true)
      // Sent with the form, not implied by it. The API refuses without both and
      // records the agreement, so this is the client's half of the evidence.
      const res = await apiClient.post('/borrower/profile/credit-profile-request', {
        ...formData,
        // The server normalises too, but sending the written form would mean
        // the pull is keyed on whichever shape happened to arrive.
        ssn: unformatSSN(formData.ssn),
        ...consent,
      })
      toast.success(res.data?.message || 'Credit profile request submitted successfully.')
      // Moves the Getting Started walkthrough on to "waiting for verification".
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.completion() })
      // On success: fetch the saved record and show details view
      await fetchSubmittedDetails()
      if (firstSubmission) onSubmitted?.()
      else setRevealNotice(true)
    } catch (err: any) {
      // Every failure on this form is reported in the form.
      //
      // A toast for a field error is the wrong channel twice over: it covers
      // part of the form on its way past, and it is gone before the borrower
      // has finished correcting the field it was about. The message belongs
      // where the mistake is - which is also where the 422 already puts it.
      if (err.response?.data?.errors) {
        const serverErrors: Record<string, string> = {}
        Object.entries(err.response.data.errors).forEach(([key, val]) => {
          serverErrors[key] = Array.isArray(val) ? val[0] : String(val)
        })
        setErrors(serverErrors)
      } else {
        // Not a validation failure (500, network). Still shown in the form, in
        // the banner above the submit button, rather than as a second copy of
        // a message the banner is already carrying.
        setErrors({ _form: err.response?.data?.message || 'Something went wrong. Please try again.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestUpdate = async () => {
    if (!creditProfile) return
    try {
      setUpdating(true)
      // An update is a new pull, so it carries its own authorisation.
      const res = await apiClient.post(
        `/borrower/profile/credit-profile/update-request/${creditProfile.id}`,
        updateConsent
      )
      toast.success(res.data?.message || 'Request sent successfully.')
      // Cleared so the next update request starts unticked again.
      setUpdateConsent({ credit_authorization_accepted: false, e_consent_accepted: false })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send update request.')
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    if (!revealNotice || !noticeRef.current) return
    noticeRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    setRevealNotice(false)
  })

  // ─── Loading / not yet initialized ─────────────────────────────────────────
  if (loading || !initialized) {
    return <TabLoader count={12} colClass="col-md-6" />
  }

  // ─── Credit Profile Details view (from borrower_credit_* tables) ────────────
  if (creditProfile) {
    return (
      <div className="fade-panel cp-page">
        <div className="cp-page-head">
          <span className="cp-page-icon" aria-hidden="true">
            <i className="ri-bar-chart-box-line"></i>
          </span>
          <div className="cp-page-heading">
            <h5 className="cp-page-title">Credit Profile</h5>
            <p className="cp-page-text">
              Your credit profile has been processed and is available for review.
            </p>
          </div>
          <span className="cp-status is-active">
            <i className="ri-checkbox-circle-fill" aria-hidden="true"></i>Active
          </span>
        </div>

        {/* The scores lead the page. They used to sit fifth, as label/value rows
            indistinguishable from "City" - see CreditScoreHero. The Credit
            Scores and Account Overview cards below were exactly these figures
            and have been removed rather than shown twice. */}
        <CreditScoreHero metrics={creditProfile.metrics} />

        {/* Negative marks come second, not sixth. They were a card of grey
            rows between the two accounts-analysis cards, so "Collections: 3"
            was drawn exactly like "Closed Accounts: 3". */}
        <CreditAccountHealth metrics={creditProfile.metrics} />

        {/* One card, not the two matching "Open Accounts Analysis" and "All
            Accounts Analysis" cards that described the same accounts from two
            angles and made the reader hold one half in their head. */}
        <CreditAccountsBreakdown metrics={creditProfile.metrics} />

        {creditProfile.metrics?.summary && (
          <div className="card border shadow-sm mb-3">
            <div className="card-header bg-transparent border-bottom py-3">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded bg-primary-subtle p-2">
                  <i className="ri-file-text-line text-primary fs-16"></i>
                </div>
                <div>
                  <div className="fw-semibold text-dark fs-14">Credit Profile Summary</div>
                  <div className="text-muted fs-12">Overall assessment</div>
                </div>
              </div>
            </div>
            <div className="card-body px-4 py-3">
              <p className="text-dark fs-14 mb-0">{creditProfile.metrics.summary}</p>
            </div>
          </div>
        )}

        {/* Identity last, and closed. It was four cards and half the page above
            the figures a borrower actually opens this tab to read. */}
        <CreditIdentityPanel
          personalInfo={creditProfile.personal_info}
          addresses={creditProfile.addresses}
        />

        {/* ── Request an update ──
            Inline rather than in a modal. An update is a new credit pull, so it
            needs its own authorisation, and consent belongs on the page next to
            the button that acts on it - not behind a confirm dialog a client
            clicks through. */}
        <div className="card border shadow-sm mt-4">
          <div className="card-header bg-transparent border-bottom py-3">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded bg-primary-subtle p-2">
                <i className="ri-refresh-line text-primary fs-16"></i>
              </div>
              <div>
                <div className="fw-semibold text-dark fs-14">Request a Credit Profile Update</div>
                <div className="text-muted fs-12">
                  This notifies the admin to pull your latest iSoftPull data
                </div>
              </div>
            </div>
          </div>
          <div className="card-body px-4 py-3">
            <CreditAuthorizationConsent
              values={updateConsent}
              onChange={setUpdateConsent}
              idPrefix="credit-profile-update"
              disabled={updating}
            />

            <div className="cp-form-actions is-flush">
              <span className="cp-actions-hint">
                {bothUpdateConsentsGiven ? (
                  <><i className="ri-checkbox-circle-line text-success" aria-hidden="true"></i>Ready to send</>
                ) : (
                  <><i className="ri-information-line" aria-hidden="true"></i>Tick both authorizations to request an update</>
                )}
              </span>
              <button
                type="button"
                className="btn btn-primary cp-submit"
                onClick={handleRequestUpdate}
                disabled={updating || !bothUpdateConsentsGiven}
              >
                {updating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending…
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line me-2"></i>Request Update
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }



  // ─── Form view ──────────────────────────────────────────────────────────────
  // Where the request stands, said once at the top. A request that was sent but
  // has not been pulled yet arrives as the request itself (see
  // fetchCreditProfileOnly), and used to look exactly like a blank form.
  const requestSent = !!submittedData || pendingRequest
  const submittedOn = formatSubmittedDate(submittedData?.created_at)

  return (
    <div className="fade-panel cp-page">
      <form onSubmit={handleSubmit} noValidate className="cp-panel">
        <div className="cp-panel-head">
          <span className="cp-page-icon" aria-hidden="true">
            <i className="ri-shield-user-line"></i>
          </span>
          <div className="cp-page-heading">
            <h5 className="cp-page-title">Soft credit check authorization</h5>
            <p className="cp-page-text">
              This is a <strong>soft inquiry</strong> and will never affect your credit score. Your
              details are encrypted in transit and at rest, and are used only to locate your credit
              file.
            </p>
          </div>
          <span
            className={`cp-status ${requestSent ? 'is-submitted' : 'is-draft'}`}
            data-testid="cp-request-status"
          >
            <i className={requestSent ? 'ri-time-line' : 'ri-draft-line'} aria-hidden="true"></i>
            {requestSent ? 'Submitted · awaiting results' : 'Not submitted'}
          </span>
        </div>

        <div className="cp-panel-body">
          {/* ── Submitted: said whenever a request is on file, with the way to update it ── */}
          {requestSent && (
            <div className="cp-alert is-success" role="status" aria-labelledby="cp-submitted-title" ref={noticeRef}>
              <i className="ri-shield-check-fill" aria-hidden="true"></i>
              <div>
                <div id="cp-submitted-title" className="cp-alert-title">Credit Profile Submitted</div>
                <div className="cp-alert-text">
                  Our team is verifying it. You can still update your details below and submit again.
                </div>
                {submittedOn && <div className="cp-alert-meta">Submitted on {submittedOn}</div>}
              </div>
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label" htmlFor="cp-first-name">First Name <span className="text-danger">*</span></label>
              <input
                id="cp-first-name"
                type="text"
                className={`form-control${errors.first_name ? ' is-invalid' : ''}`}
                value={formData.first_name}
                placeholder="e.g. John"
                autoComplete="given-name"
                onChange={e => update('first_name', e.target.value)}
              />
              {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="cp-middle-name">Middle Name <span className="text-muted fs-12">(optional)</span></label>
              <input
                id="cp-middle-name"
                type="text"
                className="form-control"
                placeholder="e.g. Michael"
                autoComplete="additional-name"
                value={formData.middle_name}
                onChange={e => update('middle_name', e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="cp-last-name">Last Name <span className="text-danger">*</span></label>
              <input
                id="cp-last-name"
                type="text"
                className={`form-control${errors.last_name ? ' is-invalid' : ''}`}
                value={formData.last_name}
                placeholder="e.g. Smith"
                autoComplete="family-name"
                onChange={e => update('last_name', e.target.value)}
              />
              {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="cp-ssn">Social Security Number <span className="text-danger">*</span></label>
              <div className="input-group">
                <input
                  id="cp-ssn"
                  type={showSSN ? 'text' : 'password'}
                  className={`form-control${errors.ssn ? ' is-invalid' : ''}`}
                  value={formData.ssn}
                  placeholder="XXX-XX-XXXX"
                  onChange={e => update('ssn', formatSSN(e.target.value))}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={11}
                />
                <button
                  type="button"
                  className="btn cp-ssn-toggle"
                  onClick={() => setShowSSN(s => !s)}
                  tabIndex={-1}
                  title={showSSN ? 'Hide SSN' : 'Show SSN'}
                >
                  <i className={showSSN ? 'ri-eye-close-line' : 'ri-eye-2-line'}></i>
                </button>
              </div>
              {personalInfo?.last_4_ssn && !formData.ssn && (
                <div className="cp-field-hint">
                  Enter your full SSN. We have one ending in {personalInfo.last_4_ssn} on file.
                </div>
              )}
              {errors.ssn && <div className="text-danger fs-12 mt-1">{errors.ssn}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="cp-dob">Date of Birth <span className="text-danger">*</span></label>
              <Flatpickr
                className={`form-control${errors.date_of_birth ? ' is-invalid' : ''}`}
                value={formData.date_of_birth}
                onChange={(_dates, dateStr) => update('date_of_birth', dateStr)}
                options={{
                  dateFormat: 'Y-m-d',
                  altInput: true,
                  altFormat: 'j M, Y',
                  maxDate: 'today',
                  monthSelectorType: 'dropdown',
                  plugins: [yearDropdownPlugin(1900)],
                  // The label has to point at the input the borrower sees: with
                  // altInput, flatpickr hides the original and shows a copy.
                  onReady: (_dates: Date[], _str: string, fp: { input: HTMLInputElement; altInput?: HTMLInputElement }) => {
                    (fp.altInput ?? fp.input).id = 'cp-dob'
                  },
                } as any}
                placeholder="Select your date of birth"
              />
              {errors.date_of_birth && <div className="invalid-feedback d-block">{errors.date_of_birth}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="cp-phone">Phone Number <span className="text-danger">*</span></label>
              <input
                id="cp-phone"
                type="tel"
                className={`form-control${errors.phone ? ' is-invalid' : ''}`}
                value={formData.phone}
                placeholder="(555) 555-5555"
                autoComplete="tel-national"
                onChange={e => update('phone', formatPhoneNumber(e.target.value))}
              />
              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="cp-email">Email Address <span className="text-danger">*</span></label>
              <input
                id="cp-email"
                type="email"
                className={`form-control${errors.email ? ' is-invalid' : ''}`}
                value={formData.email}
                placeholder="you@example.com"
                autoComplete="email"
                onChange={e => update('email', e.target.value)}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="cp-address">Street Address <span className="text-danger">*</span></label>
              <input
                id="cp-address"
                type="text"
                className={`form-control${errors.address ? ' is-invalid' : ''}`}
                value={formData.address}
                placeholder="123 Main Street"
                autoComplete="address-line1"
                onChange={e => update('address', e.target.value)}
              />
              {errors.address && <div className="invalid-feedback">{errors.address}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="cp-apt">Apt / Suite / Unit <span className="text-muted fs-12">(optional)</span></label>
              <input
                id="cp-apt"
                type="text"
                className="form-control"
                placeholder="Apt 4B"
                autoComplete="address-line2"
                value={formData.apt_suite_other}
                onChange={e => update('apt_suite_other', e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="cp-city">City <span className="text-danger">*</span></label>
              <input
                id="cp-city"
                type="text"
                className={`form-control${errors.city ? ' is-invalid' : ''}`}
                value={formData.city}
                placeholder="New York"
                autoComplete="address-level2"
                onChange={e => update('city', e.target.value)}
              />
              {errors.city && <div className="invalid-feedback">{errors.city}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">State <span className="text-danger">*</span></label>
              <CustomDropdown
                value={formData.state}
                onChange={val => update('state', val)}
                options={usStates}
                optionLabel="name"
                optionValue="name"
                placeholder="Select State"
                searchable={true}
                className={`w-100${errors.state ? ' is-invalid' : ''}`}
              />
              {errors.state && <div className="text-danger fs-12 mt-1">{errors.state}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="cp-zip">Zip Code <span className="text-danger">*</span></label>
              <input
                id="cp-zip"
                type="text"
                className={`form-control${errors.zip ? ' is-invalid' : ''}`}
                value={formData.zip}
                placeholder="10001"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                onChange={e => update('zip', formatZipCode(e.target.value))}
              />
              {errors.zip && <div className="invalid-feedback">{errors.zip}</div>}
            </div>
          </div>

          {/* ── Authorization, immediately above Submit ──
              Replaces a one-line notice that claimed authorisation by the act of
              submitting. That proved nothing: no act by the client and no record.
              See CreditAuthorizationConsent. */}
          <div className="cp-consent">
            <CreditAuthorizationConsent
              values={consent}
              onChange={setConsent}
              idPrefix="credit-profile"
              disabled={submitting}
              error={errors.credit_authorization_accepted || errors.e_consent_accepted}
            />
          </div>

          {/* ── Generic form-level error ── */}
          {errors._form && (
            <div className="cp-alert is-danger" role="alert">
              <i className="ri-error-warning-line" aria-hidden="true"></i>
              <div className="cp-alert-text">{errors._form}</div>
            </div>
          )}
        </div>

        <div className="cp-form-actions">
          <span className="cp-actions-hint">
            {bothConsentsGiven ? (
              <><i className="ri-checkbox-circle-line text-success" aria-hidden="true"></i>Ready to submit</>
            ) : (
              <><i className="ri-information-line" aria-hidden="true"></i>Check both authorizations to submit</>
            )}
          </span>
          <button
            type="submit"
            className="btn btn-primary cp-submit"
            disabled={submitting || !bothConsentsGiven}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Submitting…
              </>
            ) : (
              <>
                <i className="ri-send-plane-line me-2"></i>
                {requestSent ? 'Resubmit Credit Profile' : 'Submit Credit Profile'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
