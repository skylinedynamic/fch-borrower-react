import React from 'react'
import { Modal, ModalBody, ModalHeader, Badge, ModalFooter } from 'reactstrap'
import { usePreQualificationDetail } from '../../../modules/my-application/queries'
import { PreQualificationDetailsLoader } from '../../../components/Loader/PreQualificationDetailsLoader'

interface PreQualificationDetailsModalProps {
  isOpen: boolean
  toggle: () => void
  requestId: number | null
}

const DetailItem = ({ label, value, icon, fullWidth = false }: { label: string; value: React.ReactNode; icon?: string; fullWidth?: boolean }) => (
  <div className={`mb-3 ${fullWidth ? 'col-12' : 'col-sm-6'}`}>
    <div className="d-flex align-items-center mb-1 text-muted">
      {icon && <i className={`${icon} me-2 fs-12`}></i>}
      <span className="small text-uppercase fw-bold fs-10 ls-05">{label}</span>
    </div>
    <div className="fs-13 fw-medium text-dark text-break">
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
        <h6 className="mb-0 fs-14 fw-bold text-dark">{title}</h6>
      </div>
    </div>
    <div className="card-body pt-4">
      <div className="row">
        {children}
      </div>
    </div>
  </div>
)

export default function PreQualificationDetailsModal({ isOpen, toggle, requestId }: PreQualificationDetailsModalProps) {
  const { data: response, isLoading } = usePreQualificationDetail(requestId || 0)
  const data = response?.data

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered scrollable className="zoomIn">
      <ModalHeader toggle={toggle} className="border-bottom-0 pb-0">
        Pre-Qualification Details 
        {data && <Badge color={data.status === 'submitted' ? 'success' : 'warning'} pill className="ms-2 fs-11 text-uppercase">{data.status}</Badge>}
      </ModalHeader>
      <ModalBody className="p-4 bg-light-subtle">
        {isLoading ? (
          <PreQualificationDetailsLoader />
        ) : data ? (
          <>
            {/* Personal Information */}
            <SectionCard title="Personal Information" icon="pi pi-user">
              <DetailItem label="Full Name" value={`${data.first_name} ${data.last_name}`} fullWidth />
              <DetailItem label="Email Address" value={data.email} icon="pi pi-envelope" />
              <DetailItem label="Phone Number" value={data.phone_number} icon="pi pi-phone" />
              <DetailItem label="Business Website" value={data.business_website} icon="pi pi-globe" fullWidth />
              <DetailItem label="State of Inc." value={data.state_of_incorporation} icon="pi pi-map-marker" />
            </SectionCard>

            {/* Business Details */}
            <SectionCard title="Business Details" icon="pi pi-building">
              <DetailItem label="Business Name" value={data.business_name} fullWidth />
              <DetailItem label="Industry Type" value={data.industry_type} icon="pi pi-briefcase" />
              <DetailItem label="Business Structure" value={data.business_structure} icon="pi pi-sitemap" />
              <DetailItem label="Time in Business" value={data.time_in_business} icon="pi pi-clock" />
              <DetailItem label="Monthly Revenue" value={data.monthly_revenue} icon="pi pi-dollar" />
              <DetailItem label="Annual Revenue" value={data.annual_revenue} icon="pi pi-money-bill" />
            </SectionCard>

            {/* Financial Overview */}
            <SectionCard title="Financial Overview" icon="pi pi-wallet">
              <DetailItem label="Requested Amount" value={data.funding_requested_amount} icon="pi pi-chart-line" />
              <DetailItem label="Funding Urgency" value={data.funding_urgency} icon="pi pi-hourglass" />
              <DetailItem label="Purpose of Funding" value={data.purpose_of_funding} fullWidth />
              
              <div className="col-12"><hr className="border-light my-3" /></div>
              
              <DetailItem label="Personal Credit" value={data.personal_credit_score} />
              <DetailItem label="Business Credit (Est.)" value={data.estimated_business_credit_score} />
              
              <div className="col-12"><hr className="border-light my-3" /></div>
              
              <DetailItem label="Existing Business Debt" value={data.existing_business_debt ? 'Yes' : 'No'} />
              {data.existing_business_debt && (
                <DetailItem label="Debt Balance" value={data.debt_balance} icon="pi pi-credit-card" />
              )}
            </SectionCard>

            {/* Notes Section */}
            {data.notes && (
              <div className="card border shadow-sm border-warning-subtle">
                <div className="card-body bg-warning-subtle text-warning-emphasis rounded p-3">
                  <h6 className="fs-13 fw-bold mb-2"><i className="pi pi-info-circle me-2"></i>Additional Notes</h6>
                  <p className="mb-0 fs-13">{data.notes}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-5">
            <div className="avatar-lg mx-auto mb-3">
               <div className="avatar-title bg-light text-primary rounded-circle fs-24">
                  <i className="pi pi-exclamation-circle"></i>
               </div>
            </div>
            <h5 className="text-muted">No details available</h5>
          </div>
        )}
      </ModalBody>
      <ModalFooter className="border-top-0 pt-0">
          <button className="btn btn-light" onClick={toggle}>Close</button>
      </ModalFooter>
    </Modal>
  )
}
