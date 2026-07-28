import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useFundingApplicationDetail, downloadFundingApplicationDocument } from '../../modules/my-application'
import BorrowerActivitySidebar from '../../components/Common/BorrowerActivitySidebar'
import { FUNDING_APPLICATION_STATUS_CLASS_MAP } from '../../config/funding'
import { getFileConfig, getDocumentStatusBadgeClass } from '../../config/fileTypeConfig'
import { downloadFileFromUrl, handleFileDownload } from '../../utils/fileDownload'
import '../../components/Common/StatisticsCardSkeleton.css'

const formatDateTime = (d: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' +
           new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const Skeleton = ({ w, h, rounded = false }: { w: number | string; h: number; rounded?: boolean }) => (
    <div className={`skeleton-shimmer ${rounded ? 'rounded-circle' : 'rounded'}`} style={{ width: w, height: h }}></div>
)

const DetailItem = ({ label, value, icon, fullWidth = false }: { label: string; value: React.ReactNode; icon?: string; fullWidth?: boolean }) => (
  <div className={`mb-3 ${fullWidth ? 'col-12' : 'col-sm-6'}`}>
    <div className="d-flex align-items-center mb-1 text-muted">
      {icon && <i className={`${icon} me-2 fs-14`}></i>}
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

export default function FundingApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: response, isLoading } = useFundingApplicationDetail(id || '')
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);
  
  const application = response?.data

  if (isLoading) {
      return (
          <div className="page-content">
              <div className="container-fluid">
                  <div className="row pb-1 page-subheader-sticky bg-body">
                      <div className="col-12">
                          <div className="d-flex align-items-center justify-content-between flex-row py-2">
                              <div className="flex-grow-1">
                                  <Skeleton w={200} h={24} />
                                  <div className="mt-2"><Skeleton w={150} h={14} /></div>
                              </div>
                              <div className="mt-0">
                                  <Skeleton w={80} h={36} />
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="row g-4 mt-2">
                      <div className="col-lg-8">
                          {/* 1. Business Information Skeleton */}
                          <div className="card border shadow-sm mb-4">
                              <div className="card-header bg-white border-bottom py-3">
                                  <div className="d-flex align-items-center gap-2">
                                      <Skeleton w={24} h={24} rounded />
                                      <Skeleton w={180} h={18} />
                                  </div>
                              </div>
                              <div className="card-body pt-4">
                                  <div className="row g-3">
                                      <div className="col-12 mb-2">
                                          <div className="mb-2"><Skeleton w={60} h={12} /></div>
                                          <Skeleton w="40%" h={24} />
                                      </div>
                                      <div className="col-12 mb-2">
                                          <div className="mb-2"><Skeleton w={100} h={12} /></div>
                                          <Skeleton w="80%" h={16} />
                                      </div>
                                      <div className="col-12 mb-3">
                                          <div className="mb-2"><Skeleton w={80} h={12} /></div>
                                          <Skeleton w="60%" h={16} />
                                      </div>
                                      {[1, 2, 3, 4, 5, 6].map(i => (
                                          <div key={`biz-mid-${i}`} className="col-sm-6 mb-3">
                                              <div className="mb-2"><Skeleton w={120} h={12} /></div>
                                              <div><Skeleton w={180} h={16} /></div>
                                          </div>
                                      ))}
                                      <div className="col-12"><hr className="border-light my-1" /></div>
                                      <div className="col-12 mb-3 mt-3">
                                          <div className="mb-2"><Skeleton w={60} h={12} /></div>
                                          <Skeleton w="90%" h={16} />
                                      </div>
                                      {[1, 2, 3, 4].map(i => (
                                          <div key={`biz-bot-${i}`} className="col-sm-6 mb-3">
                                              <div className="mb-2"><Skeleton w={80} h={12} /></div>
                                              <div><Skeleton w={140} h={16} /></div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          {/* 2. Financial Information Skeleton */}
                          <div className="card border shadow-sm mb-4">
                              <div className="card-header bg-white border-bottom py-3">
                                  <div className="d-flex align-items-center gap-2">
                                      <Skeleton w={24} h={24} rounded />
                                      <Skeleton w={160} h={18} />
                                  </div>
                              </div>
                              <div className="card-body pt-4">
                                  <div className="row g-3">
                                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                          <div key={i} className="col-sm-6 mb-3">
                                              <div className="mb-2"><Skeleton w={120} h={12} /></div>
                                              <div><Skeleton w={160} h={16} /></div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          {/* 3. Funding Request Skeleton */}
                          <div className="card border shadow-sm mb-4">
                              <div className="card-header bg-white border-bottom py-3">
                                  <div className="d-flex align-items-center gap-2">
                                      <Skeleton w={24} h={24} rounded />
                                      <Skeleton w={140} h={18} />
                                  </div>
                              </div>
                              <div className="card-body pt-4">
                                  <div className="row g-3">
                                      <div className="col-12 mb-3">
                                          <div className="mb-2"><Skeleton w={100} h={12} /></div>
                                          <Skeleton w="100%" h={16} />
                                      </div>
                                      <div className="col-12 mb-3">
                                          <div className="mb-2"><Skeleton w={120} h={12} /></div>
                                          <Skeleton w="100%" h={16} />
                                      </div>
                                      {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                          <div key={`req-mid-${i}`} className="col-sm-6 mb-3">
                                              <div className="mb-2"><Skeleton w={110} h={12} /></div>
                                              <div><Skeleton w={140} h={16} /></div>
                                          </div>
                                      ))}
                                      <div className="col-12 mb-3 mt-2">
                                          <div className="mb-2"><Skeleton w={80} h={12} /></div>
                                          <Skeleton w="100%" h={16} />
                                      </div>
                                      <div className="col-12 mb-3">
                                          <div className="mb-2"><Skeleton w={120} h={12} /></div>
                                          <Skeleton w="100%" h={16} />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* 4. Compliance Disclosures Skeleton */}
                          <div className="card border shadow-sm mb-4">
                              <div className="card-header bg-white border-bottom py-3">
                                  <div className="d-flex align-items-center gap-2">
                                      <Skeleton w={24} h={24} rounded />
                                      <Skeleton w={200} h={18} />
                                  </div>
                              </div>
                              <div className="card-body pt-4">
                                  <div className="row g-3">
                                      {[1, 2, 3, 4, 5, 6].map(i => (
                                          <div key={i} className="col-sm-6 mb-3">
                                              <div className="mb-2"><Skeleton w={130} h={12} /></div>
                                              <div><Skeleton w={80} h={16} /></div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          {/* 5. Documents Skeleton */}
                          <div className="card border shadow-sm mb-4">
                              <div className="card-header bg-white border-bottom py-3 px-4">
                                  <div className="d-flex align-items-center gap-2">
                                      <Skeleton w={24} h={24} rounded />
                                      <Skeleton w={180} h={18} />
                                  </div>
                              </div>
                              <div className="card-body px-4 pb-4 pt-3">
                                  <div className="table-responsive">
                                      <table className="table table-nowrap align-middle mb-0">
                                          <thead className="table-light">
                                              <tr>
                                                  <th><Skeleton w={100} h={14} /></th>
                                                  <th><Skeleton w={60} h={14} /></th>
                                                  <th><Skeleton w={80} h={14} /></th>
                                                  <th><Skeleton w={40} h={14} /></th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {[1, 2, 3].map(i => (
                                                  <tr key={i}>
                                                      <td>
                                                          <div className="d-flex align-items-center gap-2">
                                                              <Skeleton w={24} h={24} rounded />
                                                              <Skeleton w={140} h={14} />
                                                          </div>
                                                      </td>
                                                      <td><Skeleton w={60} h={20} /></td>
                                                      <td><Skeleton w={100} h={14} /></td>
                                                      <td><Skeleton w={30} h={30} /></td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div className="col-lg-4">
                          <div className="card border shadow-sm h-100 min-vh-50">
                              <div className="card-header bg-white border-bottom py-3">
                                  <Skeleton w={100} h={18} />
                              </div>
                              <div className="card-body">
                                  <Skeleton w="100%" h={200} />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )
  }

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

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row pb-1 page-subheader-sticky bg-body">
            <div className="col-12">
                <div className="d-flex align-items-center justify-content-between flex-row py-2">
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
                    <div className="mt-0">
                        <Link to="/my-applications" className="btn fr-back-btn px-3 shadow-none">
                            &larr; Back
                        </Link>
                    </div>
                </div>
            </div>
        </div>

        <div className="row g-4 mt-2">
          <div className="col-lg-8">
            <SectionCard title="Business Information" icon="ri-building-line">
              <DetailItem 
                label="Status" 
                value={
                  <span className={`badge rounded-pill fs-12 text-uppercase ${FUNDING_APPLICATION_STATUS_CLASS_MAP[application.status] || 'bg-secondary-subtle text-secondary'}`}>
                      {application.status}
                  </span>
                } 
                fullWidth 
              />
              <DetailItem label="Business Name" value={application.business_name} fullWidth />
              <DetailItem label="Full Name" value={application.full_name} fullWidth />
              <DetailItem label="Email Address" value={application.business_email} icon="ri-mail-line" />
              <DetailItem label="Phone Number" value={application.business_phone_no} icon="ri-phone-line" />
              <DetailItem label="Industry Type" value={application.industry_type} icon="ri-briefcase-line" />
              <DetailItem label="Entity Type" value={application.entity_type} icon="ri-community-line" />
              <DetailItem label="Years in Business" value={application.years_in_business} icon="ri-time-line" />
              <DetailItem label="Number of Employees" value={application.number_of_employees} icon="ri-group-line" />

              <div className="col-12"><hr className="border-light my-3" /></div>

              <DetailItem label="Address" value={application.business_address} fullWidth />
              <DetailItem label="City" value={application.business_city} />
              <DetailItem label="State" value={application.business_state} />
              <DetailItem label="Postal Code" value={application.business_postal_code} />
              <DetailItem label="Country" value={application.business_country} />
            </SectionCard>

            {/* Financial Information */}
            <SectionCard title="Financial Information" icon="ri-wallet-3-line">
              <DetailItem label="Monthly Revenue" value={application.monthly_revenue} icon="ri-money-dollar-circle-line" />
              <DetailItem label="Annual Revenue" value={application.annual_revenue} icon="ri-bank-note-line" />
              <DetailItem label="Business Bank Name" value={application.business_bank_name} icon="ri-bank-line" />
              <DetailItem label="Checking Start Date" value={application.business_checking_start_date} icon="ri-calendar-line" />
              <DetailItem label="Personal Credit Score" value={application.self_reported_personal_credit_score} />
              <DetailItem label="Business Credit Score" value={application.self_reported_business_credit_score} />
              <DetailItem label="Has Business Debt" value={application.has_business_debt ? 'Yes' : 'No'} />
              {application.has_business_debt && (
                <DetailItem label="Debt Balance" value={application.debt_balance} icon="ri-bank-card-line" />
              )}
            </SectionCard>

            {/* Funding Request */}
            <SectionCard title="Funding Request" icon="ri-line-chart-line">
              <DetailItem label="Sequence Name" value={application.funding_sequence_name} icon="ri-list-check" fullWidth />
              <DetailItem label="Sequence Subtitle" value={application.funding_sequence_subtitle} icon="ri-align-left" fullWidth />
              <DetailItem label="Funding Request Status" value={application.funding_request_status} icon="ri-information-line" />
              <DetailItem label="Amount Range" value={application.funding_sequence_amount_range} icon="ri-bar-chart-box-line" />
              <DetailItem label="Funding Type" value={application.preferred_funding_type} icon="ri-star-line" />
              <DetailItem label="Request Amount" value={application.requested_amount ? `$${parseFloat(application.requested_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A'} icon="ri-money-dollar-circle-line" />
              <DetailItem label="Speed to Funds" value={application.funding_sequence_speed_to_funds} icon="ri-time-line" />
              <DetailItem label="Timeframe Needed" value={application.timeframe_needed} icon="ri-hourglass-line" />
              <DetailItem label="Collateral Available" value={application.collateral_available} />
              <DetailItem label="Uses" value={Array.isArray(application.funding_sequence_uses) ? application.funding_sequence_uses.join(', ') : application.funding_sequence_uses} icon="ri-briefcase-line" fullWidth />
              <DetailItem label="Purpose of Funds" value={application.purpose_of_funds} fullWidth />
              {application.purpose_note && (
                <DetailItem label="Purpose Note" value={application.purpose_note} fullWidth />
              )}
            </SectionCard>

            {/* Federal Compliance */}
            <SectionCard title="Federal Compliance Disclosures" icon="pi pi-file-check">
              <DetailItem label="Filed for Bankruptcy" value={application.filed_for_bankruptcy === null ? 'N/A' : application.filed_for_bankruptcy ? 'Yes' : 'No'} />
              <DetailItem label="Pending Lawsuits" value={application.any_pending_lawsuits === null ? 'N/A' : application.any_pending_lawsuits ? 'Yes' : 'No'} />
              <DetailItem label="Federal Loan Default" value={application.has_federal_loan === null ? 'N/A' : application.has_federal_loan ? 'Yes' : 'No'} />
              <DetailItem label="Federal Debt" value={application.has_federal_debt === null ? 'N/A' : application.has_federal_debt ? 'Yes' : 'No'} />
              <DetailItem label="Criminal Offense" value={application.has_criminal_offense === null ? 'N/A' : application.has_criminal_offense ? 'Yes' : 'No'} />
              <DetailItem label="Parole/Probation" value={application.has_parole_or_probation === null ? 'N/A' : application.has_parole_or_probation ? 'Yes' : 'No'} />
              <DetailItem label="Suspended/Debarred" value={application.suspended_or_debarred === null ? 'N/A' : application.suspended_or_debarred ? 'Yes' : 'No'} />
              <DetailItem label="Judgments (Business)" value={application.any_outstanding_judgments_business === null ? 'N/A' : application.any_outstanding_judgments_business ? 'Yes' : 'No'} />
              <DetailItem label="Judgments (Owner)" value={application.any_outstanding_judgments_owner === null ? 'N/A' : application.any_outstanding_judgments_owner ? 'Yes' : 'No'} />
              {application.federal_compliance_disclosures_explanation && (
                <DetailItem label="Explanation" value={application.federal_compliance_disclosures_explanation} fullWidth />
              )}
            </SectionCard>

            {/* Disclosures & Authorization */}
            <SectionCard title="Disclosures & Authorization" icon="pi pi-check-circle">
              <DetailItem label="Credit Pull Authorization" value={application.credit_pull_authorization ? 'Authorized' : 'Not Authorized'} />
              <DetailItem label="Terms & Conditions" value={application.terms_conditions_acceptance ? 'Accepted' : 'Not Accepted'} />
              <DetailItem label="Attestation Authorization" value={application.attestation_authorization ? 'Confirmed' : 'Pending'} />
            </SectionCard>

            {/* Uploaded Documents */}
            {application.documents && application.documents.length > 0 && (
              <div className="card border shadow-sm mb-4">
                  <div className="card-header bg-white border-bottom py-3 px-4">
                      <h6 className="mb-0 fw-bold fs-15 d-flex align-items-center">
                          <i className="ri-folder-2-line me-2 text-primary"></i>
                          Uploaded Documents
                          <span className="ms-2 badge bg-success-subtle text-success border border-success-subtle">
                              {application.documents.reduce((acc: number, group: any) => acc + (group.files?.length || 0), 0)} Attached
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
                                  {application.documents.map((docGroup: any) => 
                                      docGroup.files?.map((file: any, fileIdx: number) => {
                                          const fileName = file.original_name || file.name || file.filename || 'document';
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
                                                          file.url
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
                                                  <td className="text-start fw-medium text-dark">
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
                                                      {formatDateTime(file.created_at)}
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
                                      })
                                  )}
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
