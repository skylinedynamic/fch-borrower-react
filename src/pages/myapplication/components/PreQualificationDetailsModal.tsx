import React from 'react'
import { Modal, ModalBody } from 'reactstrap'
import { usePreQualificationDetail } from '../../../modules/my-application/queries'
import { GPT_STATUS, isIncorrectUnderwriting } from '../../../modules/my-application/types'
import type { PreQualificationDetail } from '../../../modules/my-application/types'
import PrequalDetailLoader from './detail/PrequalDetailLoader'
import DetailSection, { Field } from './detail/DetailSection'
import KeyFact from './detail/KeyFact'
import StatusChip, { toneFromBadgeClass } from './detail/StatusChip'
import '../MyApplications.css'

interface PreQualificationDetailsModalProps {
  isOpen: boolean
  toggle: () => void
  requestId: number | null
}

const statusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'submitted':
    case 'approved': return 'bg-success-subtle text-success'
    case 'pending': return 'bg-warning-subtle text-warning'
    case 'rejected':
    case 'declined': return 'bg-danger-subtle text-danger'
    default: return 'bg-secondary-subtle text-secondary'
  }
}

/** The review's state, in the client's words. */
const reviewState = (data: PreQualificationDetail) => {
  if (isIncorrectUnderwriting(data)) return { label: 'Incorrect', className: 'bg-danger-subtle text-danger' }
  if (data.gpt_status === GPT_STATUS.COMPLETED) return { label: 'Completed', className: 'bg-success-subtle text-success' }
  if (data.gpt_status === GPT_STATUS.FAILED) return { label: 'Failed', className: 'bg-warning-subtle text-warning' }
  return { label: 'In Progress', className: 'bg-secondary-subtle text-secondary' }
}

function Outcome({ data }: { data: PreQualificationDetail }) {
  const result = data.underwriting_result
  const state = reviewState(data)
  const summary = result?.funding_readiness_summary || data.validation_summary

  return (
    <section className="ma-card ma-outcome" aria-labelledby="ma-outcome-title">
      <header className="ma-card-head">
        <span className="ma-card-icon" aria-hidden="true"><i className="ri-shield-check-line"></i></span>
        <div className="min-w-0">
          <h5 id="ma-outcome-title" className="ma-card-title">Underwriting outcome</h5>
          {data.gpt_generated_at && <p className="ma-card-subtitle">Reviewed {data.gpt_generated_at}</p>}
        </div>
        <span className={`badge ma-status-pill ms-auto ${state.className}`}>{state.label}</span>
      </header>

      <div className="ma-outcome-body">
        {summary && <p className="ma-outcome-summary">{summary}</p>}

        {(!!result?.strengths?.length || !!result?.areas_requiring_attention?.length) && (
          <div className="ma-outcome-lists">
            {!!result?.strengths?.length && (
              <div className="ma-outcome-list is-good">
                <h6 id="ma-strengths">Strengths</h6>
                <ul aria-labelledby="ma-strengths">
                  {result.strengths.map((item, i) => (
                    <li key={i}><i className="ri-checkbox-circle-fill" aria-hidden="true"></i>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {!!result?.areas_requiring_attention?.length && (
              <div className="ma-outcome-list is-attention">
                <h6 id="ma-attention">Needs attention</h6>
                <ul aria-labelledby="ma-attention">
                  {result.areas_requiring_attention.map((item, i) => (
                    <li key={i}><i className="ri-error-warning-fill" aria-hidden="true"></i>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {result?.important_notice && (
          <p className="ma-outcome-notice"><i className="ri-information-line" aria-hidden="true"></i>{result.important_notice}</p>
        )}

        {/* Fixed compliance text - shown verbatim wherever the assessment is. */}
        {(result?.final_disclosure || result?.disclaimer) && (
          <div className="ma-outcome-fine">
            {result?.final_disclosure && <p><strong>Final Disclosure.</strong> {result.final_disclosure}</p>}
            {result?.disclaimer && <p><strong>Disclaimer.</strong> {result.disclaimer}</p>}
          </div>
        )}
      </div>
    </section>
  )
}

export default function PreQualificationDetailsModal({ isOpen, toggle, requestId }: PreQualificationDetailsModalProps) {
  const { data: response, isLoading } = usePreQualificationDetail(requestId || 0)
  const data = response?.data

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered scrollable className="ma-modal" labelledBy="ma-prequal-detail-title">
      <ModalBody className="ma-modal-body">
        <button type="button" className="btn-close ma-modal-close" onClick={toggle} aria-label="Close"></button>

        {isLoading ? (
          <PrequalDetailLoader />
        ) : data ? (
          <>
            {/* The outcome first: the client opens this to see where they stand,
                not to re-read what they typed. */}
            <section className="ma-hero ma-detail-hero is-compact" aria-labelledby="ma-prequal-detail-title">
              <div className="min-w-0">
                <span className="ma-hero-eyebrow"><i className="ri-file-list-3-line" aria-hidden="true"></i> Pre-Qualification Details</span>
                <h4 id="ma-prequal-detail-title" className="ma-hero-title">{data.business_name || data.purpose_of_funding || 'Pre-Qualification'}</h4>
                <div className="ma-detail-actions">
                  <StatusChip status={data.status} tone={toneFromBadgeClass(statusClass(data.status || ''))} />
                </div>
              </div>
              <div className="ma-facts">
                <KeyFact label="Requested amount" value={data.funding_requested_amount} icon="ri-money-dollar-circle-line" />
                <KeyFact label="Urgency" value={data.funding_urgency} icon="ri-timer-line" />
              </div>
            </section>

            <div className="ma-modal-content">
              {data.gpt_status && <Outcome data={data} />}

              <DetailSection title="Financial Overview" icon="ri-wallet-3-line">
                <Field label="Purpose of Funding" value={data.purpose_of_funding} wide />
                {data.purpose_note && <Field label="Purpose Note" value={data.purpose_note} wide />}
                <Field label="Personal Credit" value={data.personal_credit_score} />
                <Field label="Business Credit (Est.)" value={data.estimated_business_credit_score} />
                <Field label="Existing Business Debt" value={data.existing_business_debt ? 'Yes' : 'No'} />
                {!!data.existing_business_debt && <Field label="Debt Balance" value={data.debt_balance} />}
              </DetailSection>

              <DetailSection title="Business Details" icon="ri-building-line">
                <Field label="Business Name" value={data.business_name} wide />
                <Field label="Industry Type" value={data.industry_type} />
                <Field label="Business Structure" value={data.business_structure} />
                <Field label="Time in Business" value={data.years_in_business} />
                <Field label="Monthly Revenue" value={data.monthly_revenue} />
                <Field label="Annual Revenue" value={data.annual_revenue} />
              </DetailSection>

              <DetailSection title="Personal Information" icon="ri-user-line">
                <Field label="Full Name" value={[data.first_name, data.last_name].filter(Boolean).join(' ')} />
                <Field label="Email Address" value={data.email} />
                <Field label="Phone Number" value={data.phone_number} />
                <Field label="State of Inc." value={data.state_of_incorporation} />
                <Field label="Business Website" value={data.business_website} wide />
              </DetailSection>

              {data.notes && (
                <p className="ma-outcome-notice"><i className="ri-sticky-note-line" aria-hidden="true"></i>{data.notes}</p>
              )}
            </div>
          </>
        ) : (
          <div className="ma-empty">
            <span className="ma-empty-icon" aria-hidden="true"><i className="ri-error-warning-line"></i></span>
            <p className="ma-empty-title">No details available</p>
          </div>
        )}
      </ModalBody>
      <div className="ma-modal-footer">
        <button type="button" className="ma-action" onClick={toggle}>Close</button>
      </div>
    </Modal>
  )
}
