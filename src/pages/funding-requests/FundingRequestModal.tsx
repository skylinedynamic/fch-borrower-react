import React, { useState, useEffect } from 'react'
import { Modal, ModalBody } from 'reactstrap'
import { useNavigate } from 'react-router-dom'
import invoiceLogo from '../../../assets/images/logo-mail.png'
import { getBorrowerFundingRequest } from '../../modules/funding-requests/services'
import FundingRequestSkeleton from './FundingRequestSkeleton'
import { useBrandingStore } from '../../store/brandingStore'
import { getFileConfig } from '../../config/fileTypeConfig'
import { FUNDING_REVIEW_STATUS } from '../../config/funding'
interface FundingRequestModalProps {
    show: boolean
    onHide: () => void
    review: any
}

export default function FundingRequestModal({ show, onHide, review }: FundingRequestModalProps) {
    const { branding: globalBranding } = useBrandingStore()
    const navigate = useNavigate()
    const [fetching, setFetching] = useState(false)
    const [fullReview, setFullReview] = useState<any>(null)

    useEffect(() => {
        if (show && review?.id) {
            setFetching(true)
            getBorrowerFundingRequest(review.id)
                .then(res => {
                    if (res.success) {
                        setFullReview(res.data)
                    } else {
                        setFullReview(review)
                    }
                })
                .catch(() => {
                    setFullReview(review)
                })
                .finally(() => {
                    setFetching(false)
                })
        } else {
            setFullReview(null)
        }
    }, [show, review])

    if (!review) return null

    const displayReview = fullReview || review

    const handleProceed = () => {
        onHide()
        navigate(`/fund-application`, {
            state: {
                approved_funding: displayReview.funding_type || '',
                purpose: displayReview.use_of_funds || '',
                requested_amount: displayReview.requested_amount || ''
            }
        })
    }

    const reviewId = displayReview.id ? `FR-2024-${String(displayReview.id).padStart(5, '0')}` : '';
    const displayLogo = globalBranding?.primary_logo_full_url || globalBranding?.primary_logo || invoiceLogo;

    return (
        <Modal isOpen={show} toggle={onHide} size="lg" centered contentClassName="border-0 shadow-lg" style={{ maxWidth: '920px' }}>
            <ModalBody className="p-0">
                {fetching && !fullReview ? (
                    <FundingRequestSkeleton />
                ) : !displayReview ? (
                    <div className="p-5 text-center text-muted">
                        No review data available.
                    </div>
                ) : (
                    <div className="card shadow-none mb-0 position-relative" id="demo">
                        <div className="row p-2">


                            <div className="col-lg-12">
                                <div className="card-body p-4">
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <h6 className="text-muted text-uppercase fw-semibold mb-3">Funding Details</h6>
                                            <p className="text-muted mb-1">Funding Type: <span className="fw-medium text-dark">{displayReview.funding_type || 'N/A'}</span></p>
                                            <p className="text-muted mb-1">Requested Amount: <span className="fw-medium text-dark">{displayReview.requested_amount ? `$${Number(displayReview.requested_amount).toLocaleString()}` : 'N/A'}</span></p>
                                            <p className="text-muted mb-1">Status: <span className={`badge bg-${displayReview.status === FUNDING_REVIEW_STATUS.APPROVED ? 'success' : displayReview.status === FUNDING_REVIEW_STATUS.REJECTED ? 'danger' : 'warning'}-subtle text-${displayReview.status === FUNDING_REVIEW_STATUS.APPROVED ? 'success' : displayReview.status === FUNDING_REVIEW_STATUS.REJECTED ? 'danger' : 'warning'} fs-11 text-uppercase`}>{displayReview.status || FUNDING_REVIEW_STATUS.PENDING}</span></p>
                                            <p className="text-muted mb-0">Submitted On: <span className="fw-medium text-dark">{displayReview.created_at ? new Date(displayReview.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}</span></p>
                                        </div>
                                        <div className="col-6 text-end">
                                            <h6 className="text-muted text-uppercase fw-semibold mb-3">Borrower Details</h6>
                                            <p className="fw-medium mb-2 text-dark">{displayReview.borrower?.business_name || [displayReview.borrower?.first_name, displayReview.borrower?.last_name].filter(Boolean).join(' ') || 'Borrower Info'}</p>
                                            <p className="text-muted mb-1">{displayReview.borrower?.email || ''}</p>
                                            {displayReview.borrower?.phone && <p className="text-muted mb-0"><span>Phone: </span><span className="text-dark">{displayReview.borrower.phone}</span></p>}
                                        </div>
                                    </div>
                                </div>
                            </div>



                            <div className="col-lg-12">
                                <div className="card-body p-4">
                                    <div className="table-responsive">
                                        <table className="table table-borderless text-center table-nowrap align-middle mb-0">
                                            <thead>
                                                <tr className="table-active">
                                                    <th scope="col" className="text-start">Funding Type</th>
                                                    <th scope="col" className="text-start">Use of Funds</th>
                                                    <th scope="col" className="text-end">Requested Amount</th>
                                                    <th scope="col" className="text-end">Estimated Amount</th>
                                                    <th scope="col" className="text-end">Estimated Speed</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="text-start">
                                                        <span className="fw-medium">{displayReview.funding_sequence?.name || displayReview.funding_type || 'N/A'}</span>
                                                    </td>
                                                    <td className="text-start">
                                                        <span className="fw-medium">{displayReview.use_of_funds || 'Working Capital'}</span>
                                                    </td>
                                                    <td className="text-end">
                                                        <span className="fw-medium text-dark">{displayReview.requested_amount ? `$${Number(displayReview.requested_amount).toLocaleString()}` : 'N/A'}</span>
                                                    </td>
                                                    <td className="text-end">
                                                        {displayReview.funding_sequence?.amount_range
                                                            ? displayReview.funding_sequence.amount_range.split('-').map((num: string) => {
                                                                const cleanNum = Number(num.replace(/[^0-9.]/g, ''));
                                                                return cleanNum ? '$' + cleanNum.toLocaleString() : num.trim();
                                                            }).join(' - ')
                                                            : 'N/A'}
                                                    </td>
                                                    <td className="text-end">{displayReview.estimated_speed ? displayReview.estimated_speed.replace('Days Days', 'Days') : '1 - 7 Days'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-4 pt-3 border-top border-top-dashed">
                                        <h6 className="text-muted text-uppercase fw-semibold mb-3">
                                            Uploaded Documents
                                            {displayReview.actual_documents && displayReview.actual_documents.length > 0 && (
                                                <span className="ms-2 badge bg-success-subtle text-success text-capitalize border border-success-subtle">
                                                    {displayReview.actual_documents.length} Attached
                                                </span>
                                            )}
                                        </h6>
                                        {displayReview.actual_documents && Array.isArray(displayReview.actual_documents) && displayReview.actual_documents.length > 0 ? (
                                            <div className="table-responsive">
                                                <table className="table table-nowrap align-middle mb-0">
                                                    <thead className="table-light text-muted">
                                                        <tr>
                                                            <th scope="col" className="text-start">Document Name</th>
                                                            <th scope="col" className="text-center">Status</th>
                                                            <th scope="col" className="text-end">Upload Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {displayReview.actual_documents.map((doc: any, idx: number) => {
                                                            const displayFileName = doc.file_name || doc.document_name;
                                                            const config = getFileConfig(doc.document_url || doc.file_path || displayFileName || '');
                                                            return (
                                                                <tr key={idx} className="border-bottom border-bottom-dashed">
                                                                    <td className="text-start fw-medium text-dark">
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="avatar-xs flex-shrink-0 me-2">
                                                                                <div className={`avatar-title ${config.bg} ${config.color} rounded fs-16`}>
                                                                                    <i className={config.icon}></i>
                                                                                </div>
                                                                            </div>
                                                                            <div className="ms-1 flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                                                                                <a
                                                                                    href={doc.document_url || doc.file_path || '#'}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="text-body fw-medium d-block text-truncate"
                                                                                >
                                                                                    {doc.document_name}
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {doc.status === 'Accepted' ? (
                                                                            <span className="badge bg-success-subtle text-success">Accepted</span>
                                                                        ) : doc.status === FUNDING_REVIEW_STATUS.REJECTED ? (
                                                                            <span className="badge bg-danger-subtle text-danger" title={doc.rejection_reason || 'Rejected'}>
                                                                                Rejected {doc.rejection_reason && <i className="ri-information-line align-middle ms-1"></i>}
                                                                            </span>
                                                                        ) : doc.status === 'Under Review' ? (
                                                                            <span className="badge bg-warning-subtle text-warning">Under Review</span>
                                                                        ) : (
                                                                            <span className="badge bg-info-subtle text-info">Uploaded</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="text-end text-muted">
                                                                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-muted mb-0">No documents uploaded.</p>
                                        )}
                                    </div>

                                    {displayReview.status !== FUNDING_REVIEW_STATUS.PENDING && (
                                        <div className="mt-4 pt-3 border-top border-top-dashed">
                                            <h6 className="text-muted text-uppercase fw-semibold mb-3">Decision Details:</h6>
                                            <p className="text-muted mb-1">
                                                Reviewed By:
                                                {displayReview.reviewer?.name && (
                                                    <> <span className="fw-medium text-dark">{displayReview.reviewer.name}</span></>
                                                )}
                                            </p>
                                            {displayReview.status === FUNDING_REVIEW_STATUS.REJECTED && displayReview.reject_reason && (
                                                <p className="text-muted mb-0">Reason for Rejection: <span className="fw-medium text-danger">{displayReview.reject_reason}</span></p>
                                            )}
                                        </div>
                                    )}

                                    {displayReview.status === FUNDING_REVIEW_STATUS.APPROVED && (
                                        <div className="mt-4">
                                            <div className="alert alert-success">
                                                <p className="mb-0"><span className="fw-semibold">APPROVED:</span>
                                                    <span> Your funding request has been approved for {displayReview.funding_type}. Please proceed with the final funding application to complete your request.</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-end align-items-center flex-wrap gap-2 mt-4">
                                        <div className="hstack gap-2 flex-wrap">
                                            <button className="btn btn-light border" onClick={onHide}>
                                                <i className="ri-close-line align-bottom me-1"></i> Close
                                            </button>
                                            {displayReview.status === FUNDING_REVIEW_STATUS.APPROVED && (
                                                <button className="btn btn-primary shadow-sm" onClick={handleProceed}>
                                                    Process to Fund Application <i className="ri-arrow-right-line ms-1 align-bottom"></i>
                                                </button>
                                            )}
                                            {displayReview.status === FUNDING_REVIEW_STATUS.REJECTED && (
                                                <button className="btn btn-danger shadow-sm" onClick={() => {
                                                    onHide();
                                                    navigate(`/funding/${displayReview.funding_sequence?.id}/review`, {
                                                        state: { amount: displayReview.requested_amount || '', purpose: displayReview.use_of_funds || 'Working Capital' }
                                                    });
                                                }}>
                                                    Update Application <i className="ri-refresh-line ms-1 align-bottom"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </ModalBody>
        </Modal>
    )
}
