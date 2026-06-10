import React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Badge, Row, Col, Button } from 'reactstrap'
import { useNavigate } from 'react-router-dom'

interface FundingReviewModalProps {
    show: boolean
    onHide: () => void
    review: any
}

export default function FundingReviewModal({ show, onHide, review }: FundingReviewModalProps) {
    const navigate = useNavigate()

    if (!review) return null

    const getStatusBadge = (status: string) => {
        let bg = 'warning'
        if (status === 'Approved') bg = 'success'
        if (status === 'Rejected') bg = 'danger'
        return <Badge color={bg}>{status}</Badge>
    }

    const handleProceed = () => {
        const queryParams = new URLSearchParams()
        if (review.funding_type) queryParams.append('funding_type', review.funding_type)
        if (review.use_of_funds) queryParams.append('purpose', review.use_of_funds)
        if (review.requested_amount) queryParams.append('approved_funding', review.requested_amount)
        
        onHide()
        navigate(`/fund-application?${queryParams.toString()}`)
    }

    return (
        <Modal isOpen={show} toggle={onHide} size="lg" centered>
            <ModalHeader toggle={onHide}>
                Funding Review Details
            </ModalHeader>
            <ModalBody>
                <div className="mb-4">
                    <h5 className="fs-15 mb-3">Request Overview</h5>
                    <Row className="g-3">
                        <Col sm={6}>
                            <p className="text-muted mb-1">Funding Type</p>
                            <h6 className="fs-14">{review.funding_type || 'N/A'}</h6>
                        </Col>
                        <Col sm={6}>
                            <p className="text-muted mb-1">Requested Amount</p>
                            <h6 className="fs-14">{review.requested_amount ? `$${Number(review.requested_amount).toLocaleString()}` : 'N/A'}</h6>
                        </Col>
                        <Col sm={6}>
                            <p className="text-muted mb-1">Status</p>
                            <h6 className="fs-14">{getStatusBadge(review.status)}</h6>
                        </Col>
                        <Col sm={6}>
                            <p className="text-muted mb-1">Submitted On</p>
                            <h6 className="fs-14">{review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}</h6>
                        </Col>
                    </Row>
                </div>

                <div className="mb-4">
                    <h5 className="fs-15 mb-3">Use of Funds</h5>
                    <div className="p-3 bg-light rounded">
                        <p className="mb-0 text-dark">{review.use_of_funds || 'No details provided.'}</p>
                    </div>
                </div>

                {review.status !== 'Pending' && (
                    <div className="mb-4">
                        <h5 className="fs-15 mb-3">Decision Details</h5>
                        <Row className="g-3 bg-light p-3 rounded mx-0">
                            <Col sm={6}>
                                <p className="text-muted mb-1">Reviewed On</p>
                                <h6 className="fs-14">{review.approved_at ? new Date(review.approved_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}</h6>
                            </Col>
                            {review.status === 'Rejected' && review.reject_reason && (
                                <Col sm={12} className="mt-3">
                                    <p className="text-muted mb-1">Reason for Rejection</p>
                                    <p className="text-danger mb-0 fw-medium">{review.reject_reason}</p>
                                </Col>
                            )}
                        </Row>
                    </div>
                )}
                
                {review.status === 'Approved' && (
                    <div className="mt-4 p-4 border border-primary-subtle rounded bg-primary-subtle">
                        <h5 className="fs-15 text-primary mb-3">Proceed to Fund Application</h5>
                        <p className="text-muted fs-14 mb-0">Your funding review has been approved for <strong>{review.funding_type}</strong>. Please proceed with the final funding application to complete your request.</p>
                    </div>
                )}
            </ModalBody>
            {review.status === 'Approved' ? (
                <ModalFooter>
                    <Button color="light" onClick={onHide}>Cancel</Button>
                    <Button color="primary" onClick={handleProceed}>
                        Process to Fund Application
                    </Button>
                </ModalFooter>
            ) : (
                <ModalFooter>
                    <Button color="light" onClick={onHide}>Close</Button>
                </ModalFooter>
            )}
        </Modal>
    )
}
