import React, { useState, useEffect } from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_blue.css'
import { toast } from 'react-toastify'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { yearDropdownPlugin } from '../../../utils/flatpickrPlugins'
import { useAuth } from '../../../hooks/useAuth'
import { countries } from '../../../modules/location'
import { apiClient } from '../../../lib/http/apiClient'
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

export default function CreditProfileTab() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<CreditProfileRequestData | null>(null)
  const [creditProfile, setCreditProfile] = useState<CreditProfile | null>(null)
  const [showSSN, setShowSSN] = useState(false)
  
  const [updating, setUpdating] = useState(false)

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
  // If not set, mark as initialized immediately so the form shows right away.
  useEffect(() => {
    if (user === undefined) return // still loading auth
    if (user?.credit_profile_updated) {
      fetchCreditProfileOnly()
    } else {
      setInitialized(true)
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

  const fetchSubmittedDetails = async () => {
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
      toast.error(
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
      // On success: fetch the saved record and show details view
      await fetchSubmittedDetails()
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

  // ─── Loading / not yet initialized ─────────────────────────────────────────
  if (loading || !initialized) {
    return <TabLoader count={12} colClass="col-md-6" />
  }

  // ─── Credit Profile Details view (from borrower_credit_* tables) ────────────
  if (creditProfile) {
    return (
      <div className="fade-panel">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div>
            <div className="fw-bold text-dark fs-16">Credit Profile</div>
            <div className="text-muted fs-13">
              Your credit profile has been processed and is available for review.
            </div>
          </div>
          <div className="ms-auto flex-shrink-0">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-12 px-3 py-2">
              <i className="ri-checkbox-circle-fill me-1"></i>Active
            </span>
          </div>
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

            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn px-4 text-white"
                style={{ backgroundColor: '#021f3c', borderColor: '#021f3c' }}
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
  return (
    <div className="fade-panel">
      {/* ── Success banner (if already submitted) ── */}
      {submittedData && (
        <div className="d-flex align-items-center gap-3 p-3 mb-3 rounded-3 border"
          style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderColor: '#86efac !important' }}>
          <div className="rounded-circle bg-success d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 48, height: 48 }}>
            <i className="ri-shield-check-fill text-white fs-22"></i>
          </div>
          <div>
            <div className="fw-bold text-success-emphasis fs-15">Credit Profile Submitted</div>
            <div className="text-success-emphasis fs-13 opacity-75">
              Your soft credit check request has been securely saved. You can edit your details below if needed.
            </div>
          </div>
          <div className="ms-auto flex-shrink-0">
            <span className="badge bg-success-subtle text-success border border-success-subtle fs-12 px-3 py-2">
              <i className="ri-checkbox-circle-fill me-1"></i>Active
            </span>
          </div>
        </div>
      )}
      {/* Info notice */}
      {/* <div className="rounded-3 border border-primary-subtle bg-primary-subtle px-4 py-3 mb-4 d-flex align-items-start gap-3">
        <div className="flex-shrink-0 rounded-circle bg-primary d-flex align-items-center justify-content-center"
          style={{ width: 38, height: 38, minWidth: 38 }}>
          <i className="ri-shield-user-line text-white fs-18"></i>
        </div>
        <div>
          <div className="fw-semibold text-primary-emphasis fs-14 mb-1">Soft Credit Check Authorization</div>
          <div className="text-primary-emphasis fs-13 opacity-75">
            Please complete the form below to authorize a <strong>soft credit inquiry</strong>. This is a read-only
            check — it will <strong>never</strong> impact your credit score. All submitted data is
            <strong> encrypted</strong> and stored securely in compliance with financial regulations.
          </div>
        </div>
      </div> */}

      {/* What the borrower is agreeing to, said once at the top rather than
          left to be inferred from the consent checkboxes at the bottom. */}
      <div className="cp-form-intro">
        <i className="ri-shield-user-line"></i>
        <div>
          <div className="cp-form-intro-title">Soft credit check authorization</div>
          <div className="cp-form-intro-text">
            This is a <strong>soft inquiry</strong> and will never affect your credit score. Your
            details are encrypted in transit and at rest, and are used only to locate your credit
            file.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="cp-section">
          <div className="cp-section-head">
            <span className="cp-section-step">1</span>
            <div>
              <div className="cp-section-title">Your name</div>
              <div className="cp-section-hint">As it appears on your government-issued ID</div>
            </div>
          </div>
          <div className="cp-section-body">
            <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label">First Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control${errors.first_name ? ' is-invalid' : ''}`}
                value={formData.first_name}
                placeholder="e.g. John"
                onChange={e => update('first_name', e.target.value)}
              />
              {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label">Middle Name <span className="text-muted fs-12">(optional)</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Michael"
                value={formData.middle_name}
                onChange={e => update('middle_name', e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Last Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control${errors.last_name ? ' is-invalid' : ''}`}
                value={formData.last_name}
                placeholder="e.g. Smith"
                onChange={e => update('last_name', e.target.value)}
              />
              {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
            </div>
          </div>
          </div>
        </div>

        <div className="cp-section">
          <div className="cp-section-head">
            <span className="cp-section-step">2</span>
            <div>
              <div className="cp-section-title">Identity</div>
              <div className="cp-section-hint">Used only to locate your credit file</div>
            </div>
            <span className="cp-secure-note"><i className="ri-lock-2-line"></i>Encrypted</span>
          </div>
          <div className="cp-section-body">
            <div className="row g-2">
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
                  maxLength={11}
                />
                <button
                  type="button"
                  className="btn"
                  style={{ border: '1px solid #ced4da', background: '#fff', color: '#6c757d', boxShadow: 'none' }}
                  onClick={() => setShowSSN(s => !s)}
                  tabIndex={-1}
                  title={showSSN ? 'Hide SSN' : 'Show SSN'}
                >
                  <i className={showSSN ? 'ri-eye-close-line' : 'ri-eye-2-line'}></i>
                </button>
              </div>
              {errors.ssn && <div className="text-danger fs-12 mt-1">{errors.ssn}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
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
                } as any}
                placeholder="Select your date of birth"
              />
              {errors.date_of_birth && <div className="invalid-feedback d-block">{errors.date_of_birth}</div>}
            </div>
          </div>
          </div>
        </div>

        <div className="cp-section">
          <div className="cp-section-head">
            <span className="cp-section-step">3</span>
            <div>
              <div className="cp-section-title">Contact</div>
              <div className="cp-section-hint">Where we can reach you about this request</div>
            </div>
          </div>
          <div className="cp-section-body">
            <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label">Phone Number <span className="text-danger">*</span></label>
              <input
                type="tel"
                className={`form-control${errors.phone ? ' is-invalid' : ''}`}
                value={formData.phone}
                placeholder="(555) 555-5555"
                onChange={e => update('phone', formatPhoneNumber(e.target.value))}
              />
              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Email Address <span className="text-danger">*</span></label>
              <input
                type="email"
                className={`form-control${errors.email ? ' is-invalid' : ''}`}
                value={formData.email}
                placeholder="you@example.com"
                onChange={e => update('email', e.target.value)}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
          </div>
          </div>
        </div>

        <div className="cp-section">
          <div className="cp-section-head">
            <span className="cp-section-step">4</span>
            <div>
              <div className="cp-section-title">Home address</div>
              <div className="cp-section-hint">Your current residential address</div>
            </div>
          </div>
          <div className="cp-section-body">
            <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label">Street Address <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control${errors.address ? ' is-invalid' : ''}`}
                value={formData.address}
                placeholder="123 Main Street"
                onChange={e => update('address', e.target.value)}
              />
              {errors.address && <div className="invalid-feedback">{errors.address}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Apt / Suite / Unit <span className="text-muted fs-12">(optional)</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="Apt 4B"
                value={formData.apt_suite_other}
                onChange={e => update('apt_suite_other', e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">City <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control${errors.city ? ' is-invalid' : ''}`}
                value={formData.city}
                placeholder="New York"
                onChange={e => update('city', e.target.value)}
              />
              {errors.city && <div className="invalid-feedback">{errors.city}</div>}
            </div>
            <div className="col-md-4">
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
            <div className="col-md-4">
              <label className="form-label" htmlFor="cp-zip">Zip Code <span className="text-danger">*</span></label>
              <input
                id="cp-zip"
                type="text"
                className={`form-control${errors.zip ? ' is-invalid' : ''}`}
                value={formData.zip}
                placeholder="10001"
                inputMode="numeric"
                maxLength={5}
                onChange={e => update('zip', formatZipCode(e.target.value))}
              />
              {errors.zip && <div className="invalid-feedback">{errors.zip}</div>}
            </div>
          </div>
          </div>
        </div>

        {/* ── Generic form-level error ── */}
        {errors._form && (
          <div className="alert alert-danger border-0 fs-13 py-2 px-3 mb-3">
            <i className="ri-error-warning-line me-2"></i>{errors._form}
          </div>
        )}

        {/* ── Authorization, immediately above Submit ──
            Replaces a one-line notice that claimed authorisation by the act of
            submitting. That proved nothing: no act by the client and no record.
            See CreditAuthorizationConsent. */}
        <CreditAuthorizationConsent
          values={consent}
          onChange={setConsent}
          idPrefix="credit-profile"
          disabled={submitting}
          error={errors.credit_authorization_accepted || errors.e_consent_accepted}
        />

        <div className="d-flex justify-content-end gap-2">
          <button
            type="submit"
            className="btn btn-primary px-5"
            disabled={submitting || !bothConsentsGiven}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Submitting…
              </>
            ) : (
              <>
                <i className="ri-send-plane-line me-2"></i>Submit Credit Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
