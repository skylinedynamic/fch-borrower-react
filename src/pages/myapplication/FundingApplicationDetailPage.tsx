import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useFundingApplicationDetail, downloadFundingApplicationDocument } from '../../modules/my-application'
import BorrowerActivitySidebar from '../../components/Common/BorrowerActivitySidebar'
import { FUNDING_APPLICATION_STATUS_CLASS_MAP, FUNDING_REVIEW_STATUS } from '../../config/funding'
import { getFileConfig, getDocumentStatusBadgeClass } from '../../config/fileTypeConfig'
import { downloadFileFromUrl, handleFileDownload } from '../../utils/fileDownload'
import FundingApplicationDetailLoader from './components/FundingApplicationDetailLoader'
import '../../components/Common/StatisticsCardSkeleton.css'

const formatDateTime = (d: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' +
           new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const DetailItem = ({ label, value, icon, fullWidth = false }: { label: string; value: React.ReactNode; icon?: string; fullWidth?: boolean }) => (
  <div className={`mb-3 ${fullWidth ? 'col-12' : 'col-sm-6'}`}>
    <div className="d-flex align-items-start">
      {icon && (
        <div className="avatar-xs flex-shrink-0 me-2 mt-1">
            <span className="avatar-title bg-primary-subtle text-primary rounded fs-15 shadow-sm">
                <i className={`${icon}`}></i>
            </span>
        </div>
      )}
      <div className="flex-grow-1">
        <span className="text-uppercase fw-bold text-muted fs-12 ls-05 d-block mb-1">{label}</span>
        <div className="fs-14 fw-medium text-dark text-break">
          {value || <span className="text-muted fst-italic">Not provided</span>}
        </div>
      </div>
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

export default function FundingApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: response, isLoading } = useFundingApplicationDetail(id || '')
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);
  
  const application = response?.data

  if (isLoading) return <FundingApplicationDetailLoader />

  if (!application) {
      return (
          <div className="page-content">
              <div className="container-fluid">
                  <div className="card border-0 shadow-sm">
                      <div className="card-body text-center py-5">
                          <i className="ri-file-unknow-line fs-1 text-muted d-block mb-3" />
                          <h6 className="fw-semibold text-dark mb-1">Application not found</h6>
                          <button onClick={() => navigate('/my-applications')} className="btn btn-dark btn-sm mt-3">
                              Back to My Applications
                          </button>
                      </div>
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

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row pb-1 page-subheader-sticky bg-body">
            <div className="col-12">
                <div className="d-flex align-items-center justify-content-between flex-row flex-wrap gap-2 py-2">
                    <div className="flex-grow-1">
                        <h4 className="fs-20 mb-1">Funding Application Details</h4>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb m-0 fs-12 text-muted">
                                <li className="breadcrumb-item"><Link to="/" className="text-muted">Dashboard</Link></li>
                                <li className="breadcrumb-item"><Link to="/my-applications" className="text-muted">My Applications</Link></li>
                                <li className="breadcrumb-item active text-primary font-weight-bold" aria-current="page">Details</li>
                            </ol>
                        </nav>
                    </div>
                    <div className="mt-0 d-flex align-items-center flex-wrap text-nowrap gap-2">
                        {canEditApplication && (
                            <Link
                                to={`/fund-application/${application.funding_request_id}`}
                                className="btn btn-warning fw-medium d-flex align-items-center gap-2 shadow-none px-4 py-2"
                                title="Editing will require you to resign the application"
                            >
                                <i className="ri-edit-line me-1"></i> Edit Application
                            </Link>
                        )}
                        {isLockedForEdit && (
                            <button
                                type="button"
                                className="btn btn-light fw-medium d-flex align-items-center gap-2 shadow-none px-4 py-2"
                                disabled
                                title={lockedReason}
                            >
                                <i className="ri-lock-line me-1"></i> Can't Edit Application
                            </button>
                        )}
                        <Link to="/my-applications" className="btn fr-back-btn px-3 shadow-none">
                            &larr; Back
                        </Link>
                    </div>
                </div>
            </div>
        </div>

        {isLockedForEdit && (
          <div className="alert alert-warning d-flex align-items-start gap-2 mt-2 mb-0" role="status">
            <i className="ri-lock-line fs-16"></i>
            <div>{lockedReason}</div>
          </div>
        )}

        <div className="row g-4 mt-2">
          <div className="col-lg-8">
            <SectionCard title="Business Information" icon="ri-building-line">
              <DetailItem label="Business Name" value={application.business_name} icon="ri-store-2-line" />
              <DetailItem label="Full Name" value={application.full_name} icon="ri-user-line" />
              <DetailItem label="Email Address" value={application.business_email} icon="ri-mail-line" />
              <DetailItem label="Phone Number" value={application.business_phone_no} icon="ri-phone-line" />
              <DetailItem label="Industry Type" value={application.industry_type} icon="ri-briefcase-line" />
              <DetailItem label="Entity Type" value={application.entity_type} icon="ri-community-line" />
              <DetailItem label="Time in Business" value={application.time_in_business || application.years_in_business} icon="ri-time-line" />

              <div className="col-12"><hr className="border-light my-3" /></div>

              <DetailItem label="Address" value={application.business_address} icon="ri-map-pin-line" fullWidth />
              <DetailItem label="City" value={application.business_city} icon="ri-building-2-line" />
              <DetailItem label="State" value={application.business_state} icon="ri-map-2-line" />
              <DetailItem label="Postal Code" value={application.business_postal_code} icon="ri-map-pin-2-line" />
              <DetailItem label="Country" value={application.business_country} icon="ri-global-line" />
            </SectionCard>

            {/* Financial Information */}
            <SectionCard title="Financial Information" icon="ri-wallet-3-line">
              <DetailItem label="Monthly Revenue" value={application.monthly_revenue} icon="ri-money-dollar-circle-line" />
              <DetailItem label="Annual Revenue" value={application.annual_revenue} icon="ri-money-dollar-circle-line" />
              <DetailItem label="Business Bank Name" value={application.business_bank_name} icon="ri-bank-line" />
              <DetailItem label="Business Start Date" value={application.business_checking_start_date} icon="ri-calendar-line" />
              <DetailItem label="Personal Credit Score" value={application.self_reported_personal_credit_score} icon="ri-dashboard-3-line" />
              <DetailItem label="Business Credit Score" value={application.self_reported_business_credit_score} icon="ri-bar-chart-2-line" />
              <DetailItem label="Has Business Debt" value={application.has_business_debt ? 'Yes' : 'No'} icon="ri-question-answer-line" />
              {application.has_business_debt ? (
                <DetailItem label="Debt Balance" value={application.debt_balance} icon="ri-bank-card-line" />
              ) : (
                <div className="col-sm-6"></div>
              )}
              <DetailItem label="Time in Business" value={application.time_in_business} icon="ri-time-line" />
              <DetailItem label="Average Monthly Deposits" value={application.average_monthly_deposits} icon="ri-safe-2-line" />
              <DetailItem label="Average Bank Balance" value={application.avg_bank_balance} icon="ri-wallet-3-line" />
              <div className="col-sm-6"></div>
            </SectionCard>

            {/* Funding Request */}
            <SectionCard title="Funding Application Information" icon="ri-line-chart-line">
              <DetailItem 
                label="Status" 
                value={
                  <span className={`badge rounded-pill fs-12 text-uppercase ${FUNDING_APPLICATION_STATUS_CLASS_MAP[application.status] || 'bg-secondary-subtle text-secondary'}`}>
                      {application.status}
                  </span>
                } 
                icon="ri-information-line"
              />
              <DetailItem label="Sequence Name" value={application.funding_sequence_name} icon="ri-list-check" />
              <DetailItem label="Sequence Subtitle" value={application.funding_sequence_subtitle} icon="ri-align-left" />
              <DetailItem label="Funding Request Status" value={application.funding_request_status} icon="ri-information-line" />
              <DetailItem label="Amount Range" value={application.funding_sequence_amount_range ? application.funding_sequence_amount_range.split('-').map((v: string) => `$${Number(v.trim()).toLocaleString('en-US')}`).join(' - ') : 'N/A'} icon="ri-bar-chart-box-line" />
              <DetailItem label="Funding Type" value={application.preferred_funding_type} icon="ri-star-line" />
              <DetailItem label="Additional Funding Types" value={application.additional_funding_types?.length ? application.additional_funding_types.join(', ') : 'N/A'} icon="ri-stack-line" />
              <DetailItem label="Request Amount" value={application.requested_amount || 'N/A'} icon="ri-money-dollar-circle-line" />
              <DetailItem label="Speed to Funds" value={application.funding_sequence_speed_to_funds} icon="ri-time-line" />
              <DetailItem label="Collateral Available" value={application.collateral_available} icon="ri-safe-2-line" />
              <DetailItem label="Uses" value={Array.isArray(application.funding_sequence_uses) ? application.funding_sequence_uses.join(', ') : application.funding_sequence_uses} icon="ri-briefcase-line" fullWidth />
              <DetailItem label="Purpose of Funds" value={application.purpose_of_funds} icon="ri-focus-2-line" fullWidth />
              {application.purpose_note && (
                <DetailItem label="Purpose Note" value={application.purpose_note} icon="ri-sticky-note-line" fullWidth />
              )}
            </SectionCard>



            {/* Disclosures & Authorization */}
            <SectionCard title="Disclosures & Authorization" icon="ri-checkbox-circle-line">
              <DetailItem label="Credit Pull Authorization" value={application.credit_pull_authorization ? 'Authorized' : 'Not Authorized'} icon="ri-shield-check-line" />
              <DetailItem label="Terms & Conditions" value={application.terms_conditions_acceptance ? 'Accepted' : 'Not Accepted'} icon="ri-file-list-3-line" />
              <DetailItem label="Attestation Authorization" value={application.attestation_authorization ? 'Confirmed' : 'Pending'} icon="ri-verified-badge-line" />
              <div className="col-sm-6"></div>
            </SectionCard>

            {/* Uploaded Documents */}
            {application.documents && application.documents.length > 0 && (
              <div className="card border shadow-sm mb-4">
                  <div className="card-header bg-white border-bottom py-3 px-4">
                      <h6 className="mb-0 fw-bold fs-15 d-flex align-items-center">
                          <i className="ri-folder-2-line me-2 text-primary"></i>
                          Uploaded Documents
                          <span className="ms-2 badge bg-success-subtle text-success border border-success-subtle">
                              {application.documents.reduce((acc: number, group) => acc + (group.files?.length || 0), 0)} Attached
                          </span>
                      </h6>
                  </div>
                  <div className="card-body px-4 pb-4 pt-3">
                      <div className="table-responsive">
                          <table className="table table-nowrap align-middle mb-0">
                              <thead className="table-light text-muted">
                                  <tr>
                                      <th className="text-start">Document Name</th>
                                      <th className="text-center">Status</th>
                                      <th className="text-center">Upload Date</th>
                                      <th className="text-end">Action</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {application.documents.map((docGroup) => (
                                      // One title per document type, its files listed under it.
                                      <React.Fragment key={docGroup.type}>
                                      <tr className="border-bottom border-bottom-dashed">
                                          <td colSpan={4} className="text-start fw-semibold text-dark bg-light-subtle">
                                              <i className="ri-folder-3-line me-2 text-primary"></i>
                                              {docGroup.type}
                                              <span className="ms-2 badge bg-primary-subtle text-primary">
                                                  {docGroup.files?.length || 0} {(docGroup.files?.length || 0) === 1 ? 'file' : 'files'}
                                              </span>
                                          </td>
                                      </tr>
                                      {docGroup.files?.map((file, fileIdx: number) => {
                                          const fileName = file.original_name || file.name || 'document';
                                          const config = getFileConfig(file.url || file.path || fileName);
                                          
                                          const fileKey = file.id || `${docGroup.type}-${fileIdx}`;
                                          const handleDownload = async (e: React.MouseEvent) => {
                                              e.preventDefault();
                                              setDownloadingId(fileKey);
                                              try {
                                                  if (file.id && !String(file.id).startsWith('missing_')) {
                                                      await handleFileDownload(
                                                          () => downloadFundingApplicationDocument(file.id),
                                                          fileName,
                                                          file.url ?? undefined
                                                      );
                                                  } else if (file.url) {
                                                      await downloadFileFromUrl(file.url, fileName);
                                                  }
                                              } finally {
                                                  setDownloadingId(null);
                                              }
                                          };

                                          return (
                                              <tr key={`${docGroup.type}-${fileIdx}`} className="border-bottom border-bottom-dashed">
                                                  <td className="text-start fw-medium text-dark ps-4">
                                                      <div className="d-flex align-items-center">
                                                          <div className="avatar-xs flex-shrink-0 me-2">
                                                              <div className={`avatar-title ${config.bg} ${config.color} rounded fs-16`}>
                                                                  <i className={config.icon}></i>
                                                              </div>
                                                          </div>
                                                          <a href="#" onClick={handleDownload} className="text-body fw-medium text-truncate d-block fr-doc-link">
                                                              {fileName}
                                                          </a>
                                                      </div>
                                                  </td>
                                                  <td className="text-center">
                                                      <span className={`badge ${getDocumentStatusBadgeClass(file.status || 'Uploaded')}`}>
                                                          {file.status || 'Uploaded'}
                                                      </span>
                                                  </td>
                                                  <td className="text-center text-muted fs-12">
                                                      {formatDateTime(file.created_at ?? '')}
                                                  </td>
                                                  <td className="text-end">
                                                      <div className="d-flex gap-2 justify-content-end">
                                                          <button className="btn btn-sm btn-light border d-flex align-items-center justify-content-center fr-download-btn" onClick={handleDownload} title="Download" disabled={downloadingId === fileKey}>
                                                              {downloadingId === fileKey ? (
                                                                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                                      <span className="visually-hidden">Loading...</span>
                                                                  </div>
                                                              ) : (
                                                                  <i className="ri-download-2-line fs-14"></i>
                                                              )}
                                                          </button>
                                                      </div>
                                                  </td>
                                              </tr>
                                          );
                                      })}
                                      </React.Fragment>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
            )}
          </div>
          <div className="col-lg-4">
            <BorrowerActivitySidebar funding_application_id={id} />
          </div>
        </div>
      </div>
    </div>
  )
}
