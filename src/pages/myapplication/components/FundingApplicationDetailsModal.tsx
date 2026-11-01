import React from 'react'
import { Modal, ModalBody, ModalHeader, Badge, ModalFooter } from 'reactstrap'
import { FundingApplication } from '../../../modules/my-application/types'
import SsnValue from '../../../components/SsnValue/SsnValue'
import { FUNDING_APPLICATION_STATUS_CLASS_MAP } from '../../../config/funding'

interface FundingApplicationDetailsModalProps {
  isOpen: boolean
  toggle: () => void
  application: FundingApplication | null
}

const DetailItem = ({ label, value, icon, fullWidth = false }: { label: string; value: React.ReactNode; icon?: string; fullWidth?: boolean }) => (
  <div className={`mb-3 ${fullWidth ? 'col-12' : 'col-sm-6'}`}>
    <div className="d-flex align-items-center mb-1 text-muted">
      {icon && <i className={`${icon} me-2`}></i>}
      <span className="text-uppercase fw-bold fs-12 ls-05">{label}</span>
    </div>
    <div className="fs-14 fw-medium text-dark text-break">
      {value || <span className="text-muted fst-italic">Not provided</span>}
    </div>
  </div>
)

const SectionCard = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div className="card border shadow-sm mb-4">
    <div className="card-header bg-white border-bottom py-3">
      <div className="d-flex align-items-center">
        <div className="avatar-xs me-2">
          <span className="avatar-title rounded-circle bg-primary-subtle text-primary">
            <i className={`${icon} fs-14`}></i>
          </span>
        </div>
        <h6 className="mb-0 fs-16 fw-bold text-dark">{title}</h6>
      </div>
    </div>
    <div className="card-body pt-4">
      <div className="row">
        {children}
      </div>
    </div>
  </div>
)

export default function FundingApplicationDetailsModal({ isOpen, toggle, application }: FundingApplicationDetailsModalProps) {
  if (!application) return null

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered scrollable className="zoomIn">
      <ModalHeader toggle={toggle} className="border-bottom-0 pb-0">
        Funding Application Details
        <span className={`badge rounded-pill ms-2 fs-12 text-uppercase ${FUNDING_APPLICATION_STATUS_CLASS_MAP[application.status] || 'bg-secondary-subtle text-secondary'}`}>
          {application.status}
        </span>
      </ModalHeader>
      <ModalBody className="p-4 bg-light-subtle">
        {/* Business Information */}
        <SectionCard title="Business Information" icon="pi pi-building">
          <DetailItem label="Business Name" value={application.business_name} fullWidth />
          <DetailItem label="Full Name" value={application.full_name} fullWidth />
          <DetailItem label="Email Address" value={application.business_email} icon="pi pi-envelope" />
          <DetailItem label="Phone Number" value={application.business_phone_no} icon="pi pi-phone" />
          <DetailItem label="Industry Type" value={application.industry_type} icon="pi pi-briefcase" />
          <DetailItem label="Entity Type" value={application.entity_type} icon="pi pi-sitemap" />
          <DetailItem label="Time in Business" value={application.time_in_business || application.years_in_business} icon="pi pi-clock" />

          <div className="col-12"><hr className="border-light my-3" /></div>

          <DetailItem label="Address" value={application.business_address} fullWidth />
          <DetailItem label="City" value={application.business_city} />
          <DetailItem label="State" value={application.business_state} />
          <DetailItem label="Postal Code" value={application.business_postal_code} />
          <DetailItem label="Country" value={application.business_country} />
        </SectionCard>

        {/* Ownership Information */}
        <SectionCard title="Ownership Information" icon="pi pi-user">
          <DetailItem label="First Name" value={application.first_name} />
          <DetailItem label="Last Name" value={application.last_name} />
          <DetailItem label="Date of Birth" value={application.date_of_birth} icon="pi pi-calendar" />
          <DetailItem label="SSN" value={application.ssn ? <SsnValue value={application.ssn} /> : 'N/A'} icon="pi pi-shield" />
          <DetailItem label="Citizenship Status" value={application.citizenship_status} icon="pi pi-flag" />
          <DetailItem label="Ownership %" value={application.ownership} icon="pi pi-percentage" />
          <DetailItem label="Has Co-Borrower" value={application.has_co_borrower ? 'Yes' : 'No'} />

          <div className="col-12"><hr className="border-light my-3" /></div>

          <DetailItem label="Street Address" value={application.street_address} fullWidth />
          <DetailItem label="City" value={application.city} />
          <DetailItem label="State" value={application.state} />
          <DetailItem label="Zip Code" value={application.zip_code} />
        </SectionCard>

        {/* Financial Information */}
        <SectionCard title="Financial Information" icon="pi pi-wallet">
          <DetailItem label="Monthly Revenue" value={application.monthly_revenue} icon="pi pi-dollar" />
          <DetailItem label="Annual Revenue" value={application.annual_revenue} icon="pi pi-money-bill" />
          <DetailItem label="Business Bank Name" value={application.business_bank_name} icon="pi pi-building" />
          <DetailItem label="Checking Start Date" value={application.business_checking_start_date} icon="pi pi-calendar" />
          <DetailItem label="Personal Credit Score" value={application.self_reported_personal_credit_score} />
          <DetailItem label="Business Credit Score" value={application.self_reported_business_credit_score} />
          <DetailItem label="Has Business Debt" value={application.has_business_debt ? 'Yes' : 'No'} />
          {application.has_business_debt && (
            <DetailItem label="Debt Balance" value={application.debt_balance} icon="pi pi-credit-card" />
          )}
        </SectionCard>

        {/* Funding Request */}
        <SectionCard title="Funding Request" icon="pi pi-chart-line">
          <DetailItem label="Requested Amount" value={application.requested_amount || 'N/A'} icon="pi pi-dollar" />
          <DetailItem label="Preferred Funding Type" value={application.preferred_funding_type} icon="pi pi-star" />
          <DetailItem label="Additional Funding Types" value={application.additional_funding_types?.length ? application.additional_funding_types.join(', ') : 'N/A'} icon="pi pi-clone" />
          <DetailItem label="Timeframe Needed" value={application.timeframe_needed} icon="pi pi-hourglass" />
          <DetailItem label="Collateral Available" value={application.collateral_available} />
          <DetailItem label="Purpose of Funds" value={application.purpose_of_funds} fullWidth />
          {application.purpose_note && (
            <DetailItem label="Purpose Note" value={application.purpose_note} fullWidth />
          )}
        </SectionCard>



        {/* Disclosures & Authorization */}
        <div className="card border shadow-sm border-success-subtle">
          <div className="card-body bg-success-subtle text-success-emphasis rounded p-3">
            <h6 className="fs-14 fw-bold mb-2"><i className="pi pi-check-circle me-2"></i>Disclosures & Authorization</h6>
            <div className="row">
              <DetailItem label="Credit Pull Authorization" value={application.credit_pull_authorization ? 'Authorized' : 'Not Authorized'} />
              <DetailItem label="Terms & Conditions" value={application.terms_conditions_acceptance ? 'Accepted' : 'Not Accepted'} />
              <DetailItem label="Attestation Authorization" value={application.attestation_authorization ? 'Confirmed' : 'Pending'} />
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="border-top-0 pt-0">
        <button className="btn btn-light" onClick={toggle}>Close</button>
      </ModalFooter>
    </Modal>
  )
}
