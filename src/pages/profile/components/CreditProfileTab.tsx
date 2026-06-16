import React, { useState, useEffect } from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_blue.css'
import { toast } from 'react-toastify'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { yearDropdownPlugin } from '../../../utils/flatpickrPlugins'
import { useAuth } from '../../../hooks/useAuth'
import { countries } from '../../../data/countries'
import { apiClient } from '../../../lib/http/apiClient'
import { formatPhoneNumber, formatZipCode, maskSSN, formatDate } from '../../../utils/formatters'
import TabLoader from '../../../components/Loader/TabLoader'

interface CreditProfileRequestData {
  first_name: string
  middle_name: string | null
  last_name: string
  address: string
  apt_suite_other: string | null
  city: string
  state: string
  zip: string
  ssn: string
  date_of_birth: string
  phone: string
  email: string
  created_at?: string
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
  const [showSSN, setShowSSN] = useState(false)

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


  const usStates = countries.find(c => c.name === 'United States')?.states || []

  // Prefill from user personal info
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || prev.first_name,
        last_name: user.last_name || prev.last_name,
        email: user.email || prev.email,
        phone: user.phone_number || prev.phone,
      }))
    }
  }, [user])

  // If credit_profile_updated flag is set, try to load the actual record.
  // If not set, mark as initialized immediately so the form shows right away.
  useEffect(() => {
    if (user === undefined) return // still loading auth
    if (user?.credit_profile_updated) {
      fetchSubmittedDetails()
    } else {
      setInitialized(true)
    }
  }, [user?.credit_profile_updated])

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

  const update = (key: keyof FormState, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    // Clear the server error for this field as the user corrects it
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault()
    setErrors({})
    try {
      setSubmitting(true)
      await apiClient.post('/borrower/profile/credit-profile-request', formData)
      // On success: fetch the saved record and show details view
      await fetchSubmittedDetails()
    } catch (err: any) {
      // Map Laravel validation errors to individual field messages
      if (err.response?.data?.errors) {
        const serverErrors: Record<string, string> = {}
        Object.entries(err.response.data.errors).forEach(([key, val]) => {
          serverErrors[key] = Array.isArray(val) ? val[0] : String(val)
        })
        setErrors(serverErrors)
      } else {
        // Non-validation error (500, network, etc.) — show a generic field-level message
        setErrors({ _form: err.response?.data?.message || 'Something went wrong. Please try again.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Loading / not yet initialized ─────────────────────────────────────────
  if (loading || !initialized) {
    return <TabLoader count={12} colClass="col-md-6" />
  }

  // ─── Details view: only when a real record was returned by the API ───────────
  if (submittedData) {
    return (
      <div className="fade-panel">
        {/* ── Success banner ── */}
        <div className="d-flex align-items-center gap-3 p-3 mb-4 rounded-3 border"
          style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderColor: '#86efac !important' }}>
          <div className="rounded-circle bg-success d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 48, height: 48 }}>
            <i className="ri-shield-check-fill text-white fs-22"></i>
          </div>
          <div>
            <div className="fw-bold text-success-emphasis fs-15">Credit Profile Submitted</div>
            <div className="text-success-emphasis fs-13 opacity-75">
              Your soft credit check request has been securely saved. No impact to your credit score.
            </div>
          </div>
          <div className="ms-auto flex-shrink-0">
            <span className="badge bg-success-subtle text-success border border-success-subtle fs-12 px-3 py-2">
              <i className="ri-checkbox-circle-fill me-1"></i>Active
            </span>
          </div>
        </div>

        <div className="row g-4">
          {/* ── Personal Information ── */}
          <div className="col-lg-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded bg-primary-subtle p-2">
                    <i className="ri-user-3-line text-primary fs-16"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark fs-14">Personal Information</div>
                    <div className="text-muted fs-12">Applicant identity details</div>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 py-3">
                <DetailItem
                  label="Full Name"
                  icon="ri-account-circle-line"
                  value={[submittedData.first_name, submittedData.middle_name, submittedData.last_name].filter(Boolean).join(' ')}
                />
                <DetailItem
                  label="Date of Birth"
                  icon="ri-cake-2-line"
                  value={formatDate(submittedData.date_of_birth)}
                />
                <DetailItem
                  label="Social Security Number"
                  icon="ri-lock-line"
                  value={
                    <div className="d-flex align-items-center gap-2">
                      <span className="font-monospace fs-14">
                        {showSSN && submittedData.ssn ? submittedData.ssn : maskSSN(submittedData.ssn || '')}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-soft-secondary py-0 px-2 fs-12"
                        onClick={() => setShowSSN(s => !s)}
                      >
                        <i className={`${showSSN ? 'ri-eye-off-line' : 'ri-eye-line'} align-middle me-1`}></i>
                        {showSSN ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  }
                />
              </div>
            </div>
          </div>

          {/* ── Contact Information ── */}
          <div className="col-lg-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded bg-info-subtle p-2">
                    <i className="ri-contacts-line text-info fs-16"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark fs-14">Contact Information</div>
                    <div className="text-muted fs-12">Reach and communication details</div>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 py-3">
                <DetailItem
                  label="Email Address"
                  icon="ri-mail-line"
                  value={<a href={`mailto:${submittedData.email}`} className="text-primary text-decoration-none">{submittedData.email}</a>}
                />
                <DetailItem
                  label="Phone Number"
                  icon="ri-phone-line"
                  value={<a href={`tel:${submittedData.phone}`} className="text-dark text-decoration-none">{submittedData.phone}</a>}
                />
              </div>
            </div>
          </div>

          {/* ── Address Information ── */}
          <div className="col-12">
            <div className="card border shadow-sm">
              <div className="card-header bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded bg-warning-subtle p-2">
                    <i className="ri-map-pin-2-line text-warning fs-16"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark fs-14">Address Details</div>
                    <div className="text-muted fs-12">Residential address for credit verification</div>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 py-3">
                <div className="row g-0">
                  <div className="col-md-4">
                    <DetailItem
                      label="Street Address"
                      icon="ri-road-map-line"
                      value={
                        <>
                          {submittedData.address}
                          {submittedData.apt_suite_other && (
                            <span className="text-muted ms-2 fs-13">({submittedData.apt_suite_other})</span>
                          )}
                        </>
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <DetailItem label="City" icon="ri-building-2-line" value={submittedData.city} />
                  </div>
                  <div className="col-md-3">
                    <DetailItem label="State" icon="ri-map-2-line" value={submittedData.state} />
                  </div>
                  <div className="col-md-2">
                    <DetailItem label="Zip Code" icon="ri-mail-send-line" value={submittedData.zip} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Submission timestamp ── */}
          {submittedData.created_at && (
            <div className="col-12">
              <div className="d-flex align-items-center gap-2 text-muted fs-12 justify-content-end">
                <i className="ri-time-line"></i>
                Submitted on {new Date(submittedData.created_at).toLocaleString('en-US', {
                  dateStyle: 'medium', timeStyle: 'short'
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Form view ──────────────────────────────────────────────────────────────
  return (
    <div className="fade-panel">
      {/* Info notice */}
      <div className="rounded-3 border border-primary-subtle bg-primary-subtle px-4 py-3 mb-4 d-flex align-items-start gap-3">
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
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Full Name ── */}
        <div className="mb-4">
          <div className="row g-3">
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

        {/* ── Identity ── */}
        <div className="mb-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Social Security Number <span className="text-danger">*</span></label>
              <div className="input-group">
                <input
                  type={showSSN ? 'text' : 'password'}
                  className={`form-control${errors.ssn ? ' is-invalid' : ''}`}
                  value={formData.ssn}
                  placeholder="XXX-XX-XXXX"
                  onChange={e => update('ssn', e.target.value)}
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

        {/* ── Contact ── */}
        <div className="mb-4">
          <div className="row g-3">
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

        {/* ── Address ── */}
        <div className="mb-4">
          <div className="row g-3">
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
              <label className="form-label">Zip Code <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control${errors.zip ? ' is-invalid' : ''}`}
                value={formData.zip}
                placeholder="10001"
                maxLength={10}
                onChange={e => update('zip', formatZipCode(e.target.value))}
              />
              {errors.zip && <div className="invalid-feedback">{errors.zip}</div>}
            </div>
          </div>
        </div>

        {/* ── Generic form-level error ── */}
        {errors._form && (
          <div className="alert alert-danger border-0 fs-13 py-2 px-3 mb-3">
            <i className="ri-error-warning-line me-2"></i>{errors._form}
          </div>
        )}

        {/* ── Disclaimer + Submit ── */}
        <div className="alert alert-secondary border fs-13 d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="ri-shield-line flex-shrink-0 fs-16 text-secondary"></i>
          <span>
            By submitting, you authorize a <strong>soft credit inquiry</strong> which will not affect your credit score.
            Your information is encrypted and stored securely.
          </span>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button
            type="submit"
            className="btn btn-primary px-5"
            disabled={submitting}
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
