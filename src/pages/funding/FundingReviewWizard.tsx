import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiClient } from '../../lib/http/apiClient';
import { fetchFundingDetail } from '../../modules/funding/services';

const steps = [
    { id: 1, label: 'Review' },
    { id: 2, label: 'Application' },
    { id: 3, label: 'Documents' },
    { id: 4, label: 'Submit' }
];

const FundingReviewWizard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [fundingDetail, setFundingDetail] = useState<any>(null);
    const [reviewId, setReviewId] = useState('');
    const [submitDate, setSubmitDate] = useState('');

    const [formData, setFormData] = useState({
        requested_amount: '',
        use_of_funds: 'Working Capital',
    });

    useEffect(() => {
        if (id) {
            fetchFundingDetail(id)
                .then(res => {
                    if (res.status) {
                        setFundingDetail(res.data);
                        // set default range logic if available
                        if (res.data.amount_range) {
                            // Extract min value from range like "$10,000 - $250,000" if needed
                        }
                    } else {
                        toast.error(res.message || 'Failed to load funding details');
                    }
                })
                .catch(() => toast.error('Failed to load funding details'))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
        else navigate(-1);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const response = await apiClient.post('/borrower/funding/reviews', {
                funding_sequence_id: fundingDetail.id,
                funding_type: fundingDetail.name,
                requested_amount: formData.requested_amount,
                use_of_funds: formData.use_of_funds,
                documents_uploaded: ['bank_statement_1', 'bank_statement_2', 'voided_check', 'drivers_license', 'tax_return'],
                estimated_speed: fundingDetail.speed_to_funds ? `${fundingDetail.speed_to_funds} Days` : '1 - 7 Days'
            });
            setReviewId(response.data.data?.id ? `FR-2024-${String(response.data.data.id).padStart(5, '0')}` : 'FR-2024-000158');
            setSubmitDate(response.data.data?.created_at || new Date().toLocaleString());
            setCurrentStep(4);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit funding review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="page-content d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!fundingDetail) {
        return (
            <div className="page-content text-center py-5">
                <h4>Funding Detail Not Found</h4>
                <button className="btn btn-primary mt-3" onClick={() => navigate('/funding')}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="page-content" style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <div className="container-fluid" style={{ maxWidth: '800px' }}>
                
                {/* ── Breadcrumb ─────────────────────────────────────────────── */}
                <div className="row page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between flex-row py-2">
                            <div className="flex-grow-1">
                                <h4 className="fs-20 mb-1">Funding Review</h4>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link to="/funding">Funding Options</Link></li>
                                        <li className="breadcrumb-item"><Link to={`/funding/${id}`}>{fundingDetail.name}</Link></li>
                                        <li className="breadcrumb-item active fw-medium" aria-current="page">Funding Review</li>
                                    </ol>
                                </nav>
                            </div>
                            <div className="mt-0">
                                <Link to={`/funding/${id}`} className="btn btn-primary fw-medium">
                                    <i className="ri-arrow-left-line me-1 align-bottom"></i> Back
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stepper Header */}
                <div className="d-flex justify-content-center mb-5 pt-4">
                    <div className="d-flex align-items-center position-relative w-100" style={{ maxWidth: '600px' }}>
                        <div className="position-absolute" style={{ top: '50%', left: 0, right: 0, height: '2px', backgroundColor: '#e5e7eb', zIndex: 0, transform: 'translateY(-50%)' }}></div>
                        {steps.map((step, index) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            return (
                                <React.Fragment key={step.id}>
                                    {index !== 0 && (
                                        <div style={{ flex: 1, height: '2px', backgroundColor: isCompleted ? '#2563eb' : 'transparent', zIndex: 1 }}></div>
                                    )}
                                    <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2, background: '#f9fafb', padding: '0 10px' }}>
                                        <div 
                                            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold`}
                                            style={{ 
                                                width: '28px', 
                                                height: '28px', 
                                                fontSize: '12px',
                                                backgroundColor: isActive || isCompleted ? '#2563eb' : '#fff',
                                                color: isActive || isCompleted ? '#fff' : '#6b7280',
                                                border: isActive || isCompleted ? 'none' : '1px solid #d1d5db'
                                            }}
                                        >
                                            {step.id}
                                        </div>
                                        <span 
                                            className="mt-2 position-absolute" 
                                            style={{ 
                                                top: '30px', 
                                                fontSize: '13px', 
                                                fontWeight: isActive ? 600 : 500,
                                                color: isActive || isCompleted ? '#111827' : '#6b7280',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                    {index !== steps.length - 1 && (
                                        <div style={{ flex: 1, height: '2px', backgroundColor: isCompleted ? '#2563eb' : 'transparent', zIndex: 1 }}></div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <div className="card shadow-sm border-0 mt-5" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <div className="card-body p-5">
                        
                        {/* Step 1: Review Summary */}
                        {currentStep === 1 && (
                            <div>
                                <h4 className="fw-bold mb-2">Funding Review Summary</h4>
                                <p className="text-muted mb-4 fs-15">Please confirm your request details</p>
                                
                                <div className="border rounded-3 p-4 mb-4 bg-white shadow-sm">
                                    <div className="row mb-4">
                                        <div className="col-12 mb-3">
                                            <p className="text-muted fs-12 fw-semibold text-uppercase mb-1">Funding Type</p>
                                            <h5 className="fw-bold m-0">{fundingDetail.name}</h5>
                                        </div>
                                        <div className="col-12 mb-3">
                                            <p className="text-muted fs-12 fw-semibold text-uppercase mb-1">Recommended Range</p>
                                            <h6 className="fw-bold m-0">{fundingDetail.amount_range || '$10,000 - $250,000'}</h6>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <p className="text-muted fs-12 fw-semibold text-uppercase mb-1">Est. Speed to Funds</p>
                                            <h6 className="fw-bold m-0">{fundingDetail.speed_to_funds ? `${fundingDetail.speed_to_funds} Days` : '1 - 7 Days'}</h6>
                                        </div>
                                        <div className="col-md-6">
                                            <p className="text-muted fs-12 fw-semibold text-uppercase mb-1">Use of Funds</p>
                                            <h6 className="fw-bold m-0">Working Capital</h6>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="row g-4 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label text-muted fs-13">Requested Amount</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-white border-end-0">$</span>
                                            <input 
                                                type="number" 
                                                className="form-control border-start-0 ps-0" 
                                                placeholder="100,000"
                                                value={formData.requested_amount}
                                                onChange={(e) => setFormData({...formData, requested_amount: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted fs-13">Use of Funds</label>
                                        <select 
                                            className="form-select"
                                            value={formData.use_of_funds}
                                            onChange={(e) => setFormData({...formData, use_of_funds: e.target.value})}
                                        >
                                            <option value="Working Capital">Working Capital</option>
                                            <option value="Equipment">Equipment</option>
                                            <option value="Expansion">Expansion</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="alert alert-primary bg-primary-subtle border-0 d-flex align-items-center gap-3 py-3" style={{ borderRadius: '8px' }}>
                                    <i className="ri-information-line fs-18 text-primary"></i>
                                    <span className="fs-13 text-primary-emphasis">This is not a credit decision. Final approval amount will be determined after underwriting.</span>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Document Requirements */}
                        {currentStep === 2 && (
                            <div>
                                <h4 className="fw-bold mb-2">Document Requirements</h4>
                                <p className="text-muted mb-4 fs-15">Upload the documents below to continue</p>
                                
                                <div className="mb-4">
                                    <h6 className="fw-bold mb-3">Banking Documents</h6>
                                    <div className="d-flex align-items-center justify-content-between mb-3 border rounded-3 p-3 bg-white">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ri-checkbox-blank-line text-muted fs-18"></i>
                                            <span className="fs-14 fw-medium text-dark">Last 3 months business bank statements</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="text-danger fs-13 fw-semibold"><i className="ri-error-warning-fill align-middle me-1"></i> Missing</span>
                                            <button className="btn btn-outline-secondary btn-sm px-3 fw-medium">Upload</button>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mb-3 border rounded-3 p-3 bg-white">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ri-checkbox-blank-line text-muted fs-18"></i>
                                            <span className="fs-14 fw-medium text-dark">Voided business check</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="text-danger fs-13 fw-semibold"><i className="ri-error-warning-fill align-middle me-1"></i> Missing</span>
                                            <button className="btn btn-outline-secondary btn-sm px-3 fw-medium">Upload</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h6 className="fw-bold mb-3">Identity & Business</h6>
                                    <div className="d-flex align-items-center justify-content-between mb-3 border rounded-3 p-3 bg-white border-success-subtle">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ri-checkbox-fill text-success fs-18"></i>
                                            <span className="fs-14 fw-medium text-dark">Driver's License / ID</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="text-success fs-13 fw-semibold"><i className="ri-check-line align-middle me-1"></i> Uploaded</span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mb-3 border rounded-3 p-3 bg-white border-success-subtle">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ri-checkbox-fill text-success fs-18"></i>
                                            <span className="fs-14 fw-medium text-dark">Business Information Form</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="text-success fs-13 fw-semibold"><i className="ri-check-line align-middle me-1"></i> Uploaded</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mb-2">
                                    <h6 className="fw-bold mb-3">Financial Information</h6>
                                    <div className="d-flex align-items-center justify-content-between mb-3 border rounded-3 p-3 bg-white border-success-subtle">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ri-checkbox-fill text-success fs-18"></i>
                                            <span className="fs-14 fw-medium text-dark">Business Tax Returns (if applicable)</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <span className="text-success fs-13 fw-semibold"><i className="ri-check-line align-middle me-1"></i> Uploaded</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review & Submit */}
                        {currentStep === 3 && (
                            <div>
                                <h4 className="fw-bold mb-2">Review & Submit</h4>
                                <p className="text-muted mb-4 fs-15">Please review and submit your funding review</p>
                                
                                <div className="border rounded-3 p-4 mb-4 bg-white shadow-sm">
                                    <h6 className="fw-bold mb-4 fs-15">Review Summary</h6>
                                    <div className="table-responsive">
                                        <table className="table table-borderless table-sm m-0">
                                            <tbody>
                                                <tr>
                                                    <td className="text-muted fs-14 py-2" style={{ width: '40%' }}>Funding Type</td>
                                                    <td className="fw-medium fs-14 py-2 text-dark">{fundingDetail.name}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted fs-14 py-2">Requested Amount</td>
                                                    <td className="fw-medium fs-14 py-2 text-dark">${formData.requested_amount || '0'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted fs-14 py-2">Use of Funds</td>
                                                    <td className="fw-medium fs-14 py-2 text-dark">{formData.use_of_funds}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted fs-14 py-2">Documents Uploaded</td>
                                                    <td className="fw-medium fs-14 py-2 text-dark">5 of 5</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted fs-14 py-2">Estimated Speed</td>
                                                    <td className="fw-medium fs-14 py-2 text-dark">{fundingDetail.speed_to_funds ? `${fundingDetail.speed_to_funds} Days` : '1 - 7 Days'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                <div className="alert alert-success bg-success-subtle border-success-subtle d-flex align-items-center gap-3 py-3 mt-4" style={{ borderRadius: '8px' }}>
                                    <i className="ri-information-line fs-18 text-success"></i>
                                    <span className="fs-14 fw-medium text-success-emphasis">Your file appears complete and is ready for underwriting review.</span>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Submitted */}
                        {currentStep === 4 && (
                            <div className="text-center pt-2 pb-4">
                                <div className="mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center bg-success-subtle rounded-circle" style={{ width: '80px', height: '80px' }}>
                                        <i className="ri-check-line text-success" style={{ fontSize: '40px' }}></i>
                                    </div>
                                </div>
                                <h3 className="fw-bold mb-3">Funding Review Submitted!</h3>
                                <p className="text-muted mb-4 fs-15 px-md-5">Your request has been received and is now under<br/>FCH underwriting review.</p>
                                
                                <div className="border border-primary-subtle bg-primary-subtle rounded-3 p-4 text-start mx-auto mb-4" style={{ maxWidth: '400px' }}>
                                    <h6 className="fw-bold text-primary mb-3">What Happens Next?</h6>
                                    <ul className="list-unstyled m-0 d-flex flex-column gap-3">
                                        <li className="d-flex align-items-start gap-2 fs-14 text-dark">
                                            <i className="ri-check-line text-success fs-16 mt-1"></i>
                                            <span>Our automated underwriting engine will review your file</span>
                                        </li>
                                        <li className="d-flex align-items-start gap-2 fs-14 text-dark">
                                            <i className="ri-check-line text-success fs-16 mt-1"></i>
                                            <span>An underwriter will review and evaluate your request</span>
                                        </li>
                                        <li className="d-flex align-items-start gap-2 fs-14 text-dark">
                                            <i className="ri-check-line text-success fs-16 mt-1"></i>
                                            <span>We may contact you if additional information is needed</span>
                                        </li>
                                        <li className="d-flex align-items-start gap-2 fs-14 text-dark">
                                            <i className="ri-check-line text-success fs-16 mt-1"></i>
                                            <span>You will receive updates on your review status</span>
                                        </li>
                                    </ul>
                                </div>
                                
                                <div className="d-flex justify-content-between border-top pt-4 mx-auto" style={{ maxWidth: '400px' }}>
                                    <div className="text-start">
                                        <p className="text-muted fs-12 mb-1 fw-medium text-uppercase">Review ID</p>
                                        <h6 className="fw-bold mb-0">{reviewId}</h6>
                                    </div>
                                    <div className="text-end">
                                        <p className="text-muted fs-12 mb-1 fw-medium text-uppercase">Submitted On</p>
                                        <h6 className="fw-bold mb-0">{submitDate}</h6>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons (Steps 1-3) */}
                        {currentStep < 4 && (
                            <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top">
                                {currentStep > 1 ? (
                                    <button 
                                        className="btn btn-light fw-medium px-4 d-flex align-items-center gap-2" 
                                        onClick={handleBack}
                                        disabled={submitting}
                                    >
                                        <i className="ri-arrow-left-s-line"></i> Back
                                    </button>
                                ) : (
                                    <button 
                                        className="btn btn-link text-muted fw-medium text-decoration-none px-0" 
                                        onClick={() => navigate(-1)}
                                    >
                                        Cancel
                                    </button>
                                )}
                                
                                {currentStep < 3 ? (
                                    <button 
                                        className="btn btn-primary px-4 fw-medium d-flex align-items-center gap-2" 
                                        onClick={handleNext}
                                    >
                                        {currentStep === 1 ? 'Review Requirements' : 'Continue'} <i className="ri-arrow-right-line"></i>
                                    </button>
                                ) : (
                                    <button 
                                        className="btn btn-primary px-4 fw-medium" 
                                        onClick={handleSubmit} 
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit for Underwriting'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons (Step 4) */}
                        {currentStep === 4 && (
                            <div className="d-flex flex-column align-items-center mx-auto mt-4" style={{ maxWidth: '400px' }}>
                                <button className="btn btn-primary w-100 fw-medium py-2 mb-3">View Review Status</button>
                                <Link to="/funding" className="text-primary fw-medium text-decoration-none fs-14">Return to Funding Options</Link>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default FundingReviewWizard;
