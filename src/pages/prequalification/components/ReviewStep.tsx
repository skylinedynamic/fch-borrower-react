import React from 'react'
import type { PersonalInfo, BusinessDetails, FinancialSupport } from '../../../modules/pre-qualification'

interface ReviewStepProps {
  personal: PersonalInfo
  business: BusinessDetails
  support: FinancialSupport
  onEdit: (step: number) => void
  onPrevious: () => void
  onSubmit: () => void
  isSaving: boolean
}

export default function ReviewStep({ personal, business, support, onEdit, onPrevious, onSubmit, isSaving }: ReviewStepProps) {
  return (
    <div className="review-grid">
      <div className="review-card">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">Personal Info</h6>
          <button type="button" className="btn btn-sm btn-warning" onClick={() => onEdit(0)}>Edit</button>
        </div>
        <div className="kv"><div className="label">First Name</div><div className="value">{personal.firstName || '—'}</div></div>
        <div className="kv"><div className="label">Last Name</div><div className="value">{personal.lastName || '—'}</div></div>
        <div className="kv"><div className="label">Email</div><div className="value">{personal.email || '—'}</div></div>
        <div className="kv"><div className="label">Phone Number</div><div className="value">{personal.phoneCountry} {personal.phoneNumber || ''}</div></div>
        <div className="kv"><div className="label">Business Website</div><div className="value">{business.website || '—'}</div></div>
        <div className="kv"><div className="label">State of Incorporation</div><div className="value">{business.state || '—'}</div></div>
      </div>
      <div className="review-card">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">Business Details</h6>
          <button type="button" className="btn btn-sm btn-warning" onClick={() => onEdit(1)}>Edit</button>
        </div>
        <div className="kv"><div className="label">Business Name</div><div className="value">{business.businessName || '—'}</div></div>
        <div className="kv"><div className="label">Industry</div><div className="value">{business.industryType || '—'}</div></div>
        <div className="kv"><div className="label">Business Structure</div><div className="value">{business.entityType || '—'}</div></div>
        <div className="kv"><div className="label">Time in Business</div><div className="value">{support.yearsInBusiness || '—'}</div></div>
        <div className="kv"><div className="label">Monthly Revenue</div><div className="value">{support.monthlyRevenue || '—'}</div></div>
        <div className="kv"><div className="label">Annual Revenue</div><div className="value">{support.annualRevenue || '—'}</div></div>
      </div>
      <div className="review-card">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">Funding Needs</h6>
          <button type="button" className="btn btn-sm btn-warning" onClick={() => onEdit(2)}>Edit</button>
        </div>
        <div className="kv"><div className="label">Funding Requested Amount</div><div className="value">{support.fundingAmount || '—'}</div></div>
        <div className="kv"><div className="label">Funding Urgency</div><div className="value">{support.fundingUrgency || '—'}</div></div>
        <div className="kv"><div className="label">Purpose of Funding</div><div className="value">{support.fundingPurpose || '—'}</div></div>
        <div className="kv"><div className="label">Personal Credit Score</div><div className="value">{support.personalCreditScore || '—'}</div></div>
        <div className="kv"><div className="label">Estimate Business Credit Score</div><div className="value">{support.businessCreditScore || '—'}</div></div>
        <div className="kv"><div className="label">Note</div><div className="value">{support.note || '—'}</div></div>
        <div className="kv"><div className="label">Existing Business Debt</div><div className="value">{support.existingDebt ? (support.existingDebt === 'yes' ? 'Yes' : 'No') : '—'}</div></div>
        <div className="kv"><div className="label">Contact Consent</div><div className="value">{support.consent ? 'Agreed' : 'Not agreed'}</div></div>
      </div>
      <div className="review-card review-card-wide">
        <div className="d-flex justify-content-between align-items-center">
          <div className="text-muted">Review your details then submit</div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-warning" onClick={onPrevious}>Previous</button>
            <button type="button" className="btn next-btn" onClick={onSubmit}>{isSaving ? 'Submitting...' : 'Submit'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
