import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useFundingApplicationDetail } from '../../modules/my-application'
import { FUNDING_APPLICATION_STATUS_CLASS_MAP, FUNDING_REVIEW_STATUS } from '../../config/funding'
import FundingApplicationDetailLoader from './components/FundingApplicationDetailLoader'
import DetailSection, { Field } from './components/detail/DetailSection'
import KeyFact from './components/detail/KeyFact'
import StatusChip, { toneFromBadgeClass } from './components/detail/StatusChip'
import StageTracker from './components/detail/StageTracker'
import ApplicationDocuments from './components/detail/ApplicationDocuments'
import ApplicationActivity from './components/detail/ApplicationActivity'
import '../../components/Common/StatisticsCardSkeleton.css'
import './MyApplications.css'

/** "50000 - 250000" as "$50,000 – $250,000". */
const formatAmountRange = (range?: string | null) =>
  range ? range.split('-').map((v) => `$${Number(v.trim()).toLocaleString('en-US')}`).join(' – ') : null

const yesNo = (value: unknown, yes: string, no: string) => (value ? yes : no)

export default function FundingApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: response, isLoading } = useFundingApplicationDetail(id || '')
  const application = response?.data

  if (isLoading) return <FundingApplicationDetailLoader />

  if (!application) {
    return (
      <div className="page-content ma-page">
        <div className="container-fluid">
          <div className="ma-card ma-empty">
            <span className="ma-empty-icon" aria-hidden="true"><i className="ri-file-unknow-line"></i></span>
            <p className="ma-empty-title">Application not found</p>
            <p className="ma-empty-text">It may have been removed, or the link is no longer valid.</p>
            <button type="button" onClick={() => navigate('/my-applications')} className="ma-action ma-action-primary">
              Back to My Applications
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Same rule as the partner portal's Funding Application details page: the
  // request is approved and the application is in one of the API's editable
  // statuses (config `statuses.editable`). The server sends that as is_editable.
  const canEditApplication =
    application.funding_request_status === FUNDING_REVIEW_STATUS.APPROVED &&
    !!application.funding_request_id &&
    !!application.is_editable

  // Status not in the editable list: tell the borrower so instead of just
  // dropping the Edit button. The reason comes from the API.
  const isLockedForEdit = !!application.id && application.is_editable === false
  const lockedReason = application.locked_reason
    || `This application can no longer be edited because it is "${application.status}". Contact your funding advisor if something needs to change.`

  const statusClass = FUNDING_APPLICATION_STATUS_CLASS_MAP[application.status] || 'bg-secondary-subtle text-secondary'
  const uses = Array.isArray(application.funding_sequence_uses) ? application.funding_sequence_uses.join(', ') : application.funding_sequence_uses

  return (
    <div className="page-content ma-page">
      <div className="container-fluid">
        <section className="ma-hero ma-detail-hero" aria-labelledby="ma-detail-title">
          <div className="min-w-0">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb ma-breadcrumb">
                <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                <li className="breadcrumb-item"><Link to="/my-applications">My Applications</Link></li>
                <li className="breadcrumb-item active" aria-current="page">Details</li>
              </ol>
            </nav>
            <h4 id="ma-detail-title" className="ma-hero-title">Funding Application Details</h4>
            <p className="ma-hero-subtitle">
              {[application.business_name, application.application_number && `#${application.application_number}`].filter(Boolean).join(' · ')}
            </p>
            <div className="ma-detail-actions">
              <StatusChip status={application.status} tone={toneFromBadgeClass(statusClass)} />
              {canEditApplication && (
                <Link
                  to={`/fund-application/${application.funding_request_id}`}
                  className="ma-hero-cta"
                  title="Editing will require you to resign the application"
                >
                  <i className="ri-edit-line" aria-hidden="true"></i>Edit Application
                </Link>
              )}
              {isLockedForEdit && (
                <button type="button" className="ma-hero-link" disabled title={lockedReason}>
                  <i className="ri-lock-line" aria-hidden="true"></i>Can't Edit Application
                </button>
              )}
              <Link to="/my-applications" className="ma-hero-link">
                <i className="ri-arrow-left-line" aria-hidden="true"></i>Back
              </Link>
            </div>
          </div>
          <div className="ma-facts">
            <KeyFact label="Requested amount" value={application.requested_amount} icon="ri-money-dollar-circle-line" />
            <KeyFact label="Amount range" value={formatAmountRange(application.funding_sequence_amount_range)} icon="ri-bar-chart-box-line" />
            <KeyFact label="Speed to funds" value={application.funding_sequence_speed_to_funds} icon="ri-flashlight-line" />
            <KeyFact label="Request status" value={application.funding_request_status} icon="ri-shield-check-line" />
          </div>
        </section>

        {isLockedForEdit && (
          <div className="alert alert-warning d-flex align-items-start gap-2 mb-4" role="status">
            <i className="ri-lock-line fs-16" aria-hidden="true"></i>
            <div>{lockedReason}</div>
          </div>
        )}

        <StageTracker status={application.status} />

        <div className="row g-4">
          <div className="col-xl-8 min-w-0">
            <DetailSection title="Funding Application Information" icon="ri-line-chart-line">
              <Field label="Sequence Name" value={application.funding_sequence_name} />
              <Field label="Sequence Subtitle" value={application.funding_sequence_subtitle} />
              <Field label="Funding Type" value={application.preferred_funding_type} />
              <Field label="Additional Funding Types" value={application.additional_funding_types?.length ? application.additional_funding_types.join(', ') : 'N/A'} />
              <Field label="Collateral Available" value={application.collateral_available} />
              <Field label="Funding Request Status" value={application.funding_request_status} />
              <Field label="Uses" value={uses} wide />
              <Field label="Purpose of Funds" value={application.purpose_of_funds} wide />
              {application.purpose_note && <Field label="Purpose Note" value={application.purpose_note} wide />}
            </DetailSection>

            <DetailSection title="Business Information" icon="ri-building-line">
              <Field label="Business Name" value={application.business_name} />
              <Field label="Full Name" value={application.full_name} />
              <Field label="Email Address" value={application.business_email} />
              <Field label="Phone Number" value={application.business_phone_no} />
              <Field label="Industry Type" value={application.industry_type} />
              <Field label="Entity Type" value={application.entity_type} />
              <Field label="Time in Business" value={application.time_in_business || application.years_in_business} />
              <Field label="Address" value={application.business_address} wide />
              <Field label="City" value={application.business_city} />
              <Field label="State" value={application.business_state} />
              <Field label="Postal Code" value={application.business_postal_code} />
              <Field label="Country" value={application.business_country} />
            </DetailSection>

            <DetailSection title="Financial Information" icon="ri-wallet-3-line">
              <Field label="Monthly Revenue" value={application.monthly_revenue} />
              <Field label="Annual Revenue" value={application.annual_revenue} />
              <Field label="Average Monthly Deposits" value={application.average_monthly_deposits} />
              <Field label="Average Bank Balance" value={application.avg_bank_balance} />
              <Field label="Business Bank Name" value={application.business_bank_name} />
              <Field label="Business Start Date" value={application.business_checking_start_date} />
              <Field label="Personal Credit Score" value={application.self_reported_personal_credit_score} />
              <Field label="Business Credit Score" value={application.self_reported_business_credit_score} />
              <Field label="Has Business Debt" value={yesNo(application.has_business_debt, 'Yes', 'No')} />
              {!!application.has_business_debt && <Field label="Debt Balance" value={application.debt_balance} />}
            </DetailSection>

            <DetailSection title="Disclosures & Authorization" icon="ri-checkbox-circle-line">
              <Field label="Credit Pull Authorization" value={<Check ok={!!application.credit_pull_authorization} yes="Authorized" no="Not Authorized" />} />
              <Field label="Terms & Conditions" value={<Check ok={!!application.terms_conditions_acceptance} yes="Accepted" no="Not Accepted" />} />
              <Field label="Attestation Authorization" value={<Check ok={!!application.attestation_authorization} yes="Confirmed" no="Pending" />} />
            </DetailSection>

            {!!application.documents?.length && <ApplicationDocuments groups={application.documents} />}
          </div>

          <div className="col-xl-4">
            <ApplicationActivity fundingApplicationId={id} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** A yes/no answer with an icon, so it reads at a glance. */
function Check({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span className={`ma-check ${ok ? 'is-yes' : 'is-no'}`}>
      <i className={ok ? 'ri-checkbox-circle-fill' : 'ri-time-line'} aria-hidden="true"></i>
      {ok ? yes : no}
    </span>
  )
}
