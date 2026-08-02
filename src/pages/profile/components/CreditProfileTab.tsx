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
import { fetchCreditProfile } from '../../../modules/credit-profile'
import type { CreditProfile } from '../../../modules/credit-profile'

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
  const [creditProfile, setCreditProfile] = useState<CreditProfile | null>(null)
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
      const res = await apiClient.post('/borrower/profile/credit-profile-request', formData)
      toast.success(res.data?.message || 'Credit profile request submitted successfully.')
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
        toast.error(err.response?.data?.message || 'Please check the form for errors and try again.')
      } else {
        // Non-validation error (500, network, etc.) — show a generic field-level message
        setErrors({ _form: err.response?.data?.message || 'Something went wrong. Please try again.' })
        toast.error(err.response?.data?.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Loading / not yet initialized ─────────────────────────────────────────
  if (loading || !initialized) {
    return <TabLoader count={12} colClass="col-md-6" />
  }

  // ─── Credit Profile Details view (from borrower_credit_* tables) ────────────
  if (creditProfile) {
    const { personal_info, addresses } = creditProfile
    const currentAddress = addresses?.find(a => a.type === 'CURRENT')
    const prevAddresses = addresses?.filter(a => a.type !== 'CURRENT')

    return (
      <div className="fade-panel">
        <div className="d-flex align-items-center gap-3 p-3 mb-4 rounded-3 border"
          style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderColor: '#93c5fd !important' }}>
          <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 48, height: 48 }}>
            <i className="ri-file-list-3-line text-white fs-22"></i>
          </div>
          <div>
            <div className="fw-bold text-primary-emphasis fs-15">Credit Profile Details</div>
            <div className="text-primary-emphasis fs-13 opacity-75">
              Your credit profile has been processed and is available for review.
            </div>
          </div>
          <div className="ms-auto flex-shrink-0">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-12 px-3 py-2">
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
                    <div className="text-muted fs-12">Credit report identity data</div>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 py-3">
                <DetailItem label="Full Name" icon="ri-account-circle-line" value={personal_info?.name} />
                <DetailItem label="Date of Birth" icon="ri-cake-2-line" value={personal_info?.dob ? formatDate(personal_info.dob) : '-'} />
                <DetailItem
                  label="Social Security Number"
                  icon="ri-lock-line"
                  value={
                    <div className="d-flex align-items-center gap-2">
                      <span className="font-monospace fs-14">
                        {showSSN && personal_info?.ssn ? personal_info.ssn : maskSSN(personal_info?.ssn || '')}
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
                    <div className="text-muted fs-12">Email and phone on file</div>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 py-3">
                <DetailItem label="Email Address" icon="ri-mail-line" value={personal_info?.email ? <a href={`mailto:${personal_info.email}`} className="text-primary text-decoration-none">{personal_info.email}</a> : '-'} />
                <DetailItem label="Phone Number" icon="ri-phone-line" value={personal_info?.phone ? <a href={`tel:${personal_info.phone}`} className="text-dark text-decoration-none">{personal_info.phone}</a> : '-'} />
              </div>
            </div>
          </div>

          {/* ── Current Address ── */}
          {currentAddress && (
            <div className="col-lg-6">
              <div className="card border shadow-sm h-100">
                <div className="card-header bg-transparent border-bottom py-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded bg-warning-subtle p-2">
                      <i className="ri-map-pin-2-line text-warning fs-16"></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-dark fs-14">Current Address</div>
                      <div className="text-muted fs-12">Primary residence on record</div>
                    </div>
                  </div>
                </div>
                <div className="card-body px-4 py-3">
                  <div className="row g-0">
                    <div className="col-md-6">
                      <DetailItem label="Street Address" icon="ri-road-map-line" value={currentAddress.street} />
                    </div>
                    <div className="col-md-2">
                      <DetailItem label="City" icon="ri-building-2-line" value={currentAddress.city} />
                    </div>
                    <div className="col-md-2">
                      <DetailItem label="State" icon="ri-map-2-line" value={currentAddress.state} />
                    </div>
                    <div className="col-md-2">
                      <DetailItem label="Zip Code" icon="ri-mail-send-line" value={currentAddress.zip} />
                    </div>
                  </div>
                  {currentAddress.date_reported && (
                    <div className="text-muted fs-12 mt-2">
                      <i className="ri-calendar-line me-1"></i>Reported: {currentAddress.date_reported}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Previous Addresses ── */}
          {prevAddresses && prevAddresses.length > 0 && (
            <div className="col-lg-6">
              <div className="card border shadow-sm h-100">
                <div className="card-header bg-transparent border-bottom py-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded bg-secondary-subtle p-2">
                      <i className="ri-history-line text-secondary fs-16"></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-dark fs-14">Previous Addresses</div>
                      <div className="text-muted fs-12">{prevAddresses.length} previous address{prevAddresses.length > 1 ? 'es' : ''} on record</div>
                    </div>
                  </div>
                </div>
                <div className="card-body px-4 py-3">
                  {prevAddresses.map((addr, i) => (
                    <div key={i} className={i < prevAddresses.length - 1 ? 'border-bottom pb-2 mb-2' : ''}>
                      <div className="fs-13 fw-medium text-dark">{addr.street}</div>
                      <div className="text-muted fs-12">{addr.city}, {addr.state} {addr.zip}</div>
                      {addr.date_reported && (
                        <div className="text-muted fs-11 mt-1"><i className="ri-calendar-line me-1"></i>Reported: {addr.date_reported}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Credit Scores ── */}
          <div className="col-lg-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded bg-danger-subtle p-2">
                    <i className="ri-funds-line text-danger fs-16"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark fs-14">Credit Scores</div>
                    <div className="text-muted fs-12">Bureau-level credit scores</div>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 py-3">
                <div className="row g-0">
                  <div className="col-6">
                    <DetailItem label="FICO Score" icon="ri-bar-chart-2-line" value={creditProfile.metrics?.fico_score ?? '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Paydex Score" icon="ri-bar-chart-2-line" value={creditProfile.metrics?.paydex_score ?? '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Experian Intelliscore" icon="ri-bar-chart-2-line" value={creditProfile.metrics?.experian_intelliscore ?? '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Equifax Score" icon="ri-bar-chart-2-line" value={creditProfile.metrics?.equifax_score ?? '-'} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Account Overview ── */}
          <div className="col-lg-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded bg-success-subtle p-2">
                    <i className="ri-briefcase-4-line text-success fs-16"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark fs-14">Account Overview</div>
                    <div className="text-muted fs-12">Credit utilization and tradelines</div>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 py-3">
                <div className="row g-0">
                  <div className="col-6">
                    <DetailItem label="Active Tradelines" icon="ri-archive-line" value={creditProfile.metrics?.active_tradelines ?? '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Total Credit Limit" icon="ri-money-dollar-circle-line" value={creditProfile.metrics?.total_credit_limit != null ? `$${Number(creditProfile.metrics.total_credit_limit).toLocaleString()}` : '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Credit Utilization" icon="ri-pie-chart-2-line" value={creditProfile.metrics?.credit_utilization != null ? `${creditProfile.metrics.credit_utilization}%` : '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Recent Inquiries" icon="ri-search-eye-line" value={creditProfile.metrics?.recent_inquiries ?? '-'} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Account Health ── */}
          <div className="col-lg-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded bg-warning-subtle p-2">
                    <i className="ri-alert-line text-warning fs-16"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark fs-14">Account Health</div>
                    <div className="text-muted fs-12">Delinquencies and public records</div>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 py-3">
                <div className="row g-0">
                  <div className="col-4">
                    <DetailItem label="Delinquent" icon="ri-error-warning-line" value={creditProfile.metrics?.delinquent_accounts ?? '-'} />
                  </div>
                  <div className="col-4">
                    <DetailItem label="Public Records" icon="ri-file-text-line" value={creditProfile.metrics?.public_records ?? '-'} />
                  </div>
                  <div className="col-4">
                    <DetailItem label="Collections" icon="ri-bank-line" value={creditProfile.metrics?.collections ?? '-'} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Open Accounts Analysis ── */}
          <div className="col-lg-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded bg-info-subtle p-2">
                    <i className="ri-line-chart-line text-info fs-16"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark fs-14">Open Accounts Analysis</div>
                    <div className="text-muted fs-12">Current open account details</div>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 py-3">
                <div className="row g-0">
                  <div className="col-6">
                    <DetailItem label="Monthly Payments" icon="ri-exchange-dollar-line" value={creditProfile.metrics?.open_accounts_analysis?.monthly_payments != null ? `$${Number(creditProfile.metrics.open_accounts_analysis.monthly_payments).toLocaleString()}` : '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Balance" icon="ri-wallet-3-line" value={creditProfile.metrics?.open_accounts_analysis?.balance != null ? `$${Number(creditProfile.metrics.open_accounts_analysis.balance).toLocaleString()}` : '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Credit Limit" icon="ri-credit-card-2-line" value={creditProfile.metrics?.open_accounts_analysis?.credit_limit != null ? `$${Number(creditProfile.metrics.open_accounts_analysis.credit_limit).toLocaleString()}` : '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Available Credit" icon="ri-hand-coin-line" value={creditProfile.metrics?.open_accounts_analysis?.available_credit != null ? `$${Number(creditProfile.metrics.open_accounts_analysis.available_credit).toLocaleString()}` : '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Utilization Ratio" icon="ri-percent-line" value={creditProfile.metrics?.open_accounts_analysis?.utilization_ratio != null ? `${creditProfile.metrics.open_accounts_analysis.utilization_ratio}%` : '-'} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── All Accounts Analysis ── */}
          <div className="col-lg-6">
            <div className="card border shadow-sm h-100">
              <div className="card-header bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded bg-secondary-subtle p-2">
                    <i className="ri-donut-chart-line text-secondary fs-16"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark fs-14">All Accounts Analysis</div>
                    <div className="text-muted fs-12">Complete account history</div>
                  </div>
                </div>
              </div>
              <div className="card-body px-4 py-3">
                <div className="row g-0">
                  <div className="col-4">
                    <DetailItem label="Total Accounts" icon="ri-numbers-line" value={creditProfile.metrics?.all_accounts_analysis?.total_accounts ?? '-'} />
                  </div>
                  <div className="col-4">
                    <DetailItem label="Open Accounts" icon="ri-folder-open-line" value={creditProfile.metrics?.all_accounts_analysis?.open_accounts ?? '-'} />
                  </div>
                  <div className="col-4">
                    <DetailItem label="Closed Accounts" icon="ri-folder-close-line" value={creditProfile.metrics?.all_accounts_analysis?.closed_accounts ?? '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Newest Open" icon="ri-calendar-check-line" value={creditProfile.metrics?.all_accounts_analysis?.newest_open_date ?? '-'} />
                  </div>
                  <div className="col-6">
                    <DetailItem label="Oldest Open" icon="ri-calendar-line" value={creditProfile.metrics?.all_accounts_analysis?.oldest_open_date ?? '-'} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Summary ── */}
          {creditProfile.metrics?.summary && (
            <div className="col-12">
              <div className="card border shadow-sm">
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
            </div>
          )}
        </div>
      </div>
    )
  }



  // ─── Form view ──────────────────────────────────────────────────────────────
  return (
    <div className="fade-panel">
      {/* ── Success banner (if already submitted) ── */}
      {submittedData && (
        <div className="d-flex align-items-center gap-3 p-3 mb-4 rounded-3 border"
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
