import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { toast } from 'react-toastify';
import { apiClient } from '../../lib/http/apiClient';
import { fetchFundingDetail, fetchReadinessFactors } from '../../modules/funding/services';
import WizardLoader from '../../components/Loader/WizardLoader';
import { useDocumentTypes } from '../../modules/documents';
import { FileManagerModal } from '../../components/FileManagerModal/FileManagerModal';
import { submitFileSelection } from '../../modules/filemanager/services';
import type { FileSystemItem } from '../../modules/filemanager/types';
import { getUser } from '../../lib/auth/auth';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query';
import { useBusinessDetails, useFinancialInfo } from '../../modules/profile/queries';
import { FUNDING_WIZARD_STEPS, FUNDING_REVIEW_STATUS } from '../../config/funding';
import { useBrandingStore } from '../../store/brandingStore';
const steps = FUNDING_WIZARD_STEPS;

const FundingRequestWizard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [fundingDetail, setFundingDetail] = useState<any>(null);
    const [submitDate, setSubmitDate] = useState('');

    const branding = useBrandingStore((state: any) => state.branding);
    const [dynamicReviewerName, setDynamicReviewerName] = useState('');
    const reviewerName = dynamicReviewerName || branding?.site_name || 'Four Corner Holding';

    const { state, search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const initialAmount = state?.amount || searchParams.get('amount') || '';
    const initialPurpose = state?.purpose || searchParams.get('purpose') || 'Working Capital';

    const [formData, setFormData] = useState({
        requested_amount: initialAmount,
        use_of_funds: initialPurpose,
    });
    const [errors, setErrors] = useState<any>({});

    const [missingDocs, setMissingDocs] = useState<string[]>([]);
    const [showFileManager, setShowFileManager] = useState(false);
    const [currentDocType, setCurrentDocType] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    const { data: documentTypes } = useDocumentTypes();
    const queryClient = useQueryClient();
    const { data: businessRes } = useBusinessDetails();
    const { data: financialRes } = useFinancialInfo();

    const businessDetails = businessRes?.data || businessRes || {};
    const financialInfo = financialRes?.data || financialRes || {};

    const fetchFactors = (fundingId: string) => {
        fetchFundingDetail(fundingId).then(res => {
            if (res.status) {
                setFundingDetail(res.data);
                setMissingDocs(res.data.missing_documents || []);
            }
        }).catch(err => console.error(err));
    };

    useEffect(() => {
        if (id) {
            fetchFundingDetail(id)
                .then(res => {
                    if (res.status) {
                        if (res.data.latest_review_status === FUNDING_REVIEW_STATUS.PENDING) {
                            toast.warning('Already applied. Please wait for approval or rejection.');
                            navigate('/funding');
                            return;
                        }
                        setFundingDetail(res.data);
                        setMissingDocs(res.data.missing_documents || []);

                        setFormData(prev => {
                            const newAmount = prev.requested_amount || res.data.latest_requested_amount || '';
                            const newPurpose = (prev.use_of_funds && prev.use_of_funds !== 'Working Capital') ? prev.use_of_funds : (res.data.latest_use_of_funds || prev.use_of_funds);
                            return { requested_amount: newAmount, use_of_funds: newPurpose };
                        });
                    } else {
                        toast.error(res.message || 'Failed to load funding details');
                    }
                })
                .catch(() => toast.error('Failed to load funding details'))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleFileSelection = async (selectedFiles: FileSystemItem[]) => {
        if (currentDocType) {
            setUploading(true);
            try {
                const filePaths = selectedFiles.map(f => f.path);
                await submitFileSelection(filePaths, '/borrower/documents/upload', {
                    document_type_id: currentDocType.id
                });

                await queryClient.invalidateQueries({ queryKey: queryKeys.documents.list() });
                toast.success(`Files attached to ${currentDocType.name}`);
                setShowFileManager(false);
                fetchFactors(id as string);
            } catch (error) {
                console.error('Failed to attach files', error);
                toast.error('Failed to attach files');
            } finally {
                setUploading(false);
            }
        }
    };

    const isDocsRequired = fundingDetail?.require_documents_uploaded;

    const handleNext = () => {
        if (currentStep === 1) {
            let newErrors: any = {};
            if (!formData.requested_amount) {
                newErrors.requested_amount = 'Requested amount is required';
            } else if (isNaN(Number(formData.requested_amount))) {
                newErrors.requested_amount = 'Requested amount must be a number';
            } else {
                const amount = Number(formData.requested_amount);
                if (amount < 0) {
                    newErrors.requested_amount = 'Requested amount cannot be negative';
                }
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
            setErrors({});
        }

        if (currentStep === 3 && isDocsRequired && missingDocs.length > 0) {
            toast.error('Please upload all required documents to continue');
            return;
        }

        if (currentStep < 4) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
        else navigate(-1);
    };
    const requiredDocTypes = (isDocsRequired && documentTypes && fundingDetail?.allowed_documents?.length)
        ? documentTypes.filter(t => fundingDetail.allowed_documents.includes(t.id))
        : [];
    const uploadedCount = requiredDocTypes.length - missingDocs.length;

    const handleSubmit = async () => {
        if (isDocsRequired && missingDocs.length > 0) {
            toast.error('Please upload all required documents before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await apiClient.post('/borrower/funding/reviews', {
                funding_sequence_id: fundingDetail.id,
                funding_type: fundingDetail.name,
                requested_amount: formData.requested_amount,
                use_of_funds: formData.use_of_funds,
                documents_uploaded: requiredDocTypes.filter(t => !missingDocs.includes(t.name)).map(t => t.name),
                estimated_speed: fundingDetail.speed_to_funds ? `${fundingDetail.speed_to_funds} Days` : '1 - 7 Days'
            });
            const reviewData = response.data.data;
            setSubmitDate(reviewData?.updated_at || reviewData?.created_at || new Date().toLocaleString());
            
            if (reviewData?.reviewer?.name) {
                setDynamicReviewerName(reviewData.reviewer.name);
            }
            setCurrentStep(4);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit funding request');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <WizardLoader />;

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
            <FileManagerModal
                isOpen={showFileManager}
                toggle={() => setShowFileManager(!showFileManager)}
                section={currentDocType?.name || ''}
                selectionMode={true}
                onSelectFiles={handleFileSelection}
                entityType="borrowers"
                entityId={getUser()?.entity_id}
            />
            <div className="container-fluid">

                {/* ── Breadcrumb ─────────────────────────────────────────────── */}
                <div className="row page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between flex-row py-2">
                            <div className="flex-grow-1">
                                <h4 className="fs-20 mb-1">Funding Request</h4>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link to="/funding">Funding Options</Link></li>
                                        <li className="breadcrumb-item"><Link to={`/funding/${id}`}>{fundingDetail?.name}</Link></li>
                                        <li className="breadcrumb-item active fw-medium" aria-current="page">Funding Request</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto" style={{ maxWidth: '800px' }}>

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
                                            <div style={{ flex: 1, height: '2px', backgroundColor: (currentStep > step.id || currentStep === step.id) ? 'var(--primary-color, #0a192f)' : 'transparent', zIndex: 1 }}></div>
                                        )}
                                        <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2, background: '#f9fafb', padding: '0 10px' }}>
                                            <div
                                                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold`}
                                                style={{
                                                    width: isActive ? '40px' : '32px',
                                                    height: isActive ? '40px' : '32px',
                                                    fontSize: isActive ? '16px' : (isCompleted ? '18px' : '14px'),
                                                    backgroundColor: isActive ? 'var(--primary-color, #0a192f)' : '#fff',
                                                    color: isActive ? '#fff' : (isCompleted ? 'var(--primary-color, #0a192f)' : '#6b7280'),
                                                    border: isActive ? 'none' : (isCompleted ? '2px solid var(--primary-color, #0a192f)' : '2px solid #e5e7eb'),
                                                    boxShadow: isActive ? '0 0 0 4px #e5e7eb' : 'none',
                                                    transition: 'all 0.2s ease-in-out'
                                                }}
                                            >
                                                {isCompleted ? <i className="ri-check-line"></i> : step.id}
                                            </div>
                                            <span
                                                className="mt-2 position-absolute"
                                                style={{
                                                    top: '42px',
                                                    fontSize: '13px',
                                                    fontWeight: isActive ? 600 : 400,
                                                    color: (isActive || isCompleted) ? 'var(--primary-color, #0a192f)' : '#6b7280',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {step.label}
                                            </span>
                                        </div>
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
                                    <h3 className="fw-bold mb-2" style={{ color: '#0f172a' }}>Funding Request Summary</h3>
                                    <p className="mb-4 fs-14" style={{ color: '#64748b' }}>Please confirm your request details</p>

                                    <div className="border rounded p-4 mb-4" style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}>
                                        <div className="row align-items-center">
                                            <div className="col-md-7">
                                                <div className="mb-4">
                                                    <p className="fs-11 fw-bold text-uppercase mb-1" style={{ color: '#94a3b8', letterSpacing: '0.5px' }}>Funding Type</p>
                                                    <h5 className="fw-bold m-0" style={{ color: '#0f172a' }}>{fundingDetail.name}</h5>
                                                </div>
                                                <div className="mb-4">
                                                    <p className="fs-11 fw-bold text-uppercase mb-1" style={{ color: '#94a3b8', letterSpacing: '0.5px' }}>Recommended Range</p>
                                                    <h6 className="fw-bold m-0 fs-14" style={{ color: '#0f172a' }}>{fundingDetail.amount_range || '$5K - $250K'}</h6>
                                                </div>
                                                <div>
                                                    <p className="fs-11 fw-bold text-uppercase mb-1" style={{ color: '#94a3b8', letterSpacing: '0.5px' }}>Est. Speed to Funds</p>
                                                    <h6 className="fw-bold m-0 fs-14 d-flex align-items-center gap-1" style={{ color: '#0f172a' }}>
                                                        {fundingDetail.speed_to_funds ? (fundingDetail.speed_to_funds.toLowerCase().includes('day') ? fundingDetail.speed_to_funds : `${fundingDetail.speed_to_funds} Days`) : '7-14 Days'}
                                                        <i className="ri-information-line fs-14" style={{ color: '#94a3b8' }}></i>
                                                    </h6>
                                                </div>
                                            </div>
                                            <div className="col-md-5 d-flex flex-column align-items-center justify-content-center text-center">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px', backgroundColor: '#f1f5f9' }}>
                                                    <i className="ri-bank-card-line" style={{ fontSize: '28px', color: '#2563eb' }}></i>
                                                </div>
                                                <p className="fs-11 fw-bold text-uppercase mb-1" style={{ color: '#94a3b8', letterSpacing: '0.5px' }}>Use of Funds</p>
                                                <h6 className="fw-bold m-0 fs-14" style={{ color: '#0f172a' }}>Working Capital</h6>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row g-4 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fs-13 mb-2" style={{ color: '#64748b' }}>Requested Amount</label>
                                            <div className="input-group rounded" style={{ border: '1px solid', borderColor: errors.requested_amount ? '#dc3545' : '#e2e8f0', overflow: 'hidden' }}>
                                                <span className="input-group-text bg-white" style={{ color: '#475569', border: 'none', borderRight: '1px solid #e2e8f0', borderRadius: 0 }}>$</span>
                                                <input
                                                    type="number"
                                                    className={`form-control ps-2 shadow-none`}
                                                    style={{ backgroundColor: 'transparent', border: 'none' }}
                                                    placeholder="200000.00"
                                                    value={formData.requested_amount}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, requested_amount: e.target.value });
                                                        if (errors.requested_amount) setErrors({ ...errors, requested_amount: null });
                                                    }}
                                                />
                                            </div>
                                            {errors.requested_amount && <div className="text-danger fs-12 mt-1">{errors.requested_amount}</div>}
                                            {!errors.requested_amount && formData.requested_amount && (() => {
                                                const amount = Number(formData.requested_amount);
                                                const rangeStr = fundingDetail?.amount_range || '$5K - $250K';
                                                const parts = rangeStr.split('-');
                                                const parsePart = (p: string) => {
                                                    let val = p.replace(/[^0-9.]/g, '');
                                                    if (p.toUpperCase().includes('K')) return parseFloat(val) * 1000;
                                                    if (p.toUpperCase().includes('M')) return parseFloat(val) * 1000000;
                                                    return parseFloat(val);
                                                };
                                                if (parts.length === 2 && !isNaN(amount) && amount >= 0) {
                                                    const min = parsePart(parts[0]);
                                                    const max = parsePart(parts[1]);
                                                    if (amount < min || amount > max) {
                                                        return (
                                                            <div className="d-flex align-items-start gap-2 mt-2 p-3" style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px', color: '#b45309' }}>
                                                                <i className="ri-error-warning-line fs-16 mt-1"></i>
                                                                <span className="fs-13"><strong>Please note:</strong> Your requested amount falls outside the recommended range of {rangeStr}.</span>
                                                            </div>
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fs-13 mb-2" style={{ color: '#64748b' }}>Use of Funds</label>
                                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem', backgroundColor: '#fff', overflow: 'hidden' }}>
                                                <Dropdown
                                                    value={formData.use_of_funds}
                                                    options={[
                                                        { label: 'Working Capital', value: 'Working Capital' },
                                                        { label: 'Equipment', value: 'Equipment' },
                                                        { label: 'Expansion', value: 'Expansion' },
                                                        { label: 'Other', value: 'Other' }
                                                    ]}
                                                    onChange={(e) => setFormData({ ...formData, use_of_funds: e.value })}
                                                    className="w-100 shadow-none border-0 bg-transparent"
                                                    style={{ height: '38px', backgroundColor: 'transparent' }}
                                                    panelStyle={{ backgroundColor: '#fff' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="alert border-0 d-flex align-items-center gap-3 py-3" style={{ backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                                        <i className="ri-information-fill fs-18" style={{ color: '#2563eb' }}></i>
                                        <span className="fs-13" style={{ color: '#1e3a8a' }}>This is not a credit decision. Final approval amount will be determined after underwriting.</span>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Application Summary */}
                            {currentStep === 2 && (
                                <div>
                                    <h4 className="fw-bold mb-2">Application Summary</h4>
                                    <p className="text-muted mb-4 fs-15">Please review your business information</p>

                                    <div className="alert alert-primary bg-primary-subtle border-0 d-flex align-items-center gap-3 py-3 mb-4" style={{ borderRadius: '8px' }}>
                                        <i className="ri-information-line fs-18 text-primary"></i>
                                        <span className="fs-13 text-primary-emphasis">Please confirm that the information below is accurate. This information is sourced from your profile and cannot be edited here.</span>
                                    </div>

                                    <div className="row g-4 mb-2">
                                        {/* Business Information */}
                                        <div className="col-md-6">
                                            <div className="border rounded-3 p-4 bg-white shadow-sm h-100">
                                                <div className="d-flex align-items-center gap-3 mb-4">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary" style={{ width: '40px', height: '40px' }}>
                                                        <i className="ri-building-line text-white fs-20"></i>
                                                    </div>
                                                    <h6 className="fw-bold m-0 text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>Business Information</h6>
                                                </div>
                                                <div className="d-flex flex-column gap-3">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Legal Business Name</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>{businessDetails?.legal_business_name || 'ABC Solutions LLC'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Business Structure</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>{businessDetails?.entity_type || 'Limited Liability Company (LLC)'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Industry</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>{businessDetails?.industry || 'Professional Services'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>EIN / Tax ID</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>{businessDetails?.tax_id || '12-3456789'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Time in Business</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>{businessDetails?.time_in_business || '2 - 5 Years'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Number of Employees</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>{businessDetails?.number_of_employees || '5 - 10'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Overview */}
                                        <div className="col-md-6">
                                            <div className="border rounded-3 p-4 bg-white shadow-sm h-100">
                                                <div className="d-flex align-items-center gap-3 mb-4">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-success" style={{ width: '40px', height: '40px' }}>
                                                        <i className="ri-money-dollar-circle-line text-white fs-20"></i>
                                                    </div>
                                                    <h6 className="fw-bold m-0 text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>Financial Overview</h6>
                                                </div>
                                                <div className="d-flex flex-column gap-3">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Gross Annual Revenue</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>${financialInfo?.gross_annual_revenue?.toLocaleString() || '500,000'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Average Monthly Revenue</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>${financialInfo?.average_monthly_revenue?.toLocaleString() || '45,000'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Time in Business</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>{businessDetails?.time_in_business || '2 - 5 Years'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Requested Amount</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>${Number(formData.requested_amount || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Use of Funds</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>{formData.use_of_funds}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Address */}
                                        <div className="col-md-6">
                                            <div className="border rounded-3 p-4 bg-white shadow-sm h-100">
                                                <div className="d-flex align-items-center gap-3 mb-4">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: '#a855f7', width: '40px', height: '40px' }}>
                                                        <i className="ri-map-pin-line text-white fs-20"></i>
                                                    </div>
                                                    <h6 className="fw-bold m-0 text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>Business Address</h6>
                                                </div>
                                                <div className="d-flex flex-column gap-3">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '35%' }}>Address</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '65%' }}>
                                                            {businessDetails?.address_line1 || '123 Business Blvd, Suite 100'}<br />
                                                            {businessDetails?.city || 'New York'}, {businessDetails?.state || 'NY'} {businessDetails?.zip_code || '10001'}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start mt-2">
                                                        <span className="text-muted fs-13" style={{ width: '35%' }}>Phone</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '65%' }}>{businessDetails?.business_phone || '(555) 123-4567'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start mt-2">
                                                        <span className="text-muted fs-13" style={{ width: '35%' }}>Email</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '65%' }}>{businessDetails?.business_email || 'info@abcsolutions.com'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Funding Details */}
                                        <div className="col-md-6">
                                            <div className="border rounded-3 p-4 bg-white shadow-sm h-100">
                                                <div className="d-flex align-items-center gap-3 mb-4">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning" style={{ width: '40px', height: '40px' }}>
                                                        <i className="ri-bank-card-line text-white fs-20"></i>
                                                    </div>
                                                    <h6 className="fw-bold m-0 text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>Funding Details</h6>
                                                </div>
                                                <div className="d-flex flex-column gap-3">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Funding Type</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>{fundingDetail.name}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Estimated Speed to Funds</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>{fundingDetail.speed_to_funds ? `${fundingDetail.speed_to_funds} Days` : '1 - 7 Days'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13" style={{ width: '45%' }}>Recommended Range</span>
                                                        <span className="fw-medium fs-13 text-dark text-end" style={{ width: '55%' }}>{fundingDetail.amount_range || '$10,000 - $250,000'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Document Requirements */}
                            {currentStep === 3 && (
                                <div>
                                    <h4 className="fw-bold mb-2">Document Requirements</h4>

                                    {!isDocsRequired ? (
                                        <div className="alert border-0 d-flex align-items-center gap-3 py-3 mb-4" style={{ borderRadius: '8px', backgroundColor: '#f1f5f9' }}>
                                            <i className="ri-checkbox-circle-fill fs-24" style={{ color: 'var(--primary-color, #0a192f)' }}></i>
                                            <div>
                                                <h6 className="fw-bold mb-1" style={{ color: 'var(--primary-color, #0a192f)' }}>No Documents Required</h6>
                                                <span className="fs-13" style={{ color: '#475569' }}>You do not need to upload any specific documents for this funding option. You can proceed directly to submit.</span>
                                            </div>
                                        </div>
                                    ) : requiredDocTypes.length === 0 ? (
                                        <div className="alert border-0 d-flex align-items-center gap-3 py-3 mb-4" style={{ borderRadius: '8px', backgroundColor: '#f1f5f9' }}>
                                            <i className="ri-information-fill fs-24" style={{ color: 'var(--primary-color, #0a192f)' }}></i>
                                            <div className="flex-grow-1">
                                                <h6 className="fw-bold mb-1" style={{ color: 'var(--primary-color, #0a192f)' }}>Supporting Documents Needed</h6>
                                                <span className="fs-13" style={{ color: '#475569' }}>No specific documents are strictly required, but please upload relevant business documents (like Bank Statements) to help with underwriting.</span>
                                            </div>
                                            <button
                                                className="btn btn-sm px-3 fw-medium flex-shrink-0 text-white"
                                                style={{ backgroundColor: 'var(--primary-color, #0a192f)', border: '1px solid var(--primary-color, #0a192f)' }}
                                                onClick={() => {
                                                    setCurrentDocType(documentTypes?.[0] || { id: 1, name: 'Business Bank Statements' });
                                                    setShowFileManager(true);
                                                }}
                                                disabled={uploading}
                                            >
                                                Upload Documents
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-muted mb-4 fs-15">Upload the documents below to continue</p>
                                            <div className="mb-4">
                                                {requiredDocTypes.map(docType => {
                                                    const isMissing = missingDocs.includes(docType.name);
                                                    return (
                                                        <div key={docType.id} className={`d-flex align-items-center justify-content-between mb-3 border rounded-3 p-3 bg-white`} style={{ borderColor: !isMissing ? 'var(--primary-color, #0a192f)' : '#dee2e6' }}>
                                                            <div className="d-flex align-items-center gap-2">
                                                                {isMissing ? (
                                                                    <i className="ri-checkbox-blank-line text-muted fs-18"></i>
                                                                ) : (
                                                                    <i className="ri-checkbox-fill fs-18" style={{ color: 'var(--primary-color, #0a192f)' }}></i>
                                                                )}
                                                                <span className="fs-14 fw-medium text-dark">{docType.name}</span>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-3">
                                                                {isMissing ? (
                                                                    <>
                                                                        <span className="text-danger fs-13 fw-semibold"><i className="ri-error-warning-fill align-middle me-1"></i> Missing</span>
                                                                        <button
                                                                            className="btn btn-outline-secondary btn-sm px-3 fw-medium"
                                                                            onClick={() => {
                                                                                setCurrentDocType(docType);
                                                                                setShowFileManager(true);
                                                                            }}
                                                                            disabled={uploading}
                                                                        >
                                                                            Upload
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="fs-13 fw-semibold me-3" style={{ color: 'var(--primary-color, #0a192f)' }}><i className="ri-check-line align-middle me-1"></i> Uploaded</span>
                                                                        {fundingDetail?.latest_review_status === 'Rejected' && (
                                                                            <button
                                                                                className="btn btn-light border btn-sm px-3 fw-medium"
                                                                                onClick={() => {
                                                                                    setCurrentDocType(docType);
                                                                                    setShowFileManager(true);
                                                                                }}
                                                                                disabled={uploading}
                                                                            >
                                                                                Upload Again
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Submitted */}
                            {currentStep === 4 && (
                                <div className="text-center pt-2 pb-4">
                                    <div className="mb-4 position-relative d-inline-block">
                                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9' }}>
                                            <i className="ri-check-line fw-bolder" style={{ fontSize: '40px', color: 'var(--primary-color, #0a192f)' }}></i>
                                        </div>
                                    </div>
                                    <h3 className="fw-bold mb-3" style={{ color: '#0f172a' }}>Funding Request Submitted!</h3>
                                    <p className="text-muted mb-4 fs-15 px-md-5">Your request has been received and is now under<br />{reviewerName} underwriting review.</p>

                                    <div className="rounded-3 p-4 text-start mx-auto mb-4" style={{ maxWidth: '600px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <h6 className="fw-bold mb-3" style={{ color: 'var(--primary-color, #0a192f)' }}>What Happens Next?</h6>
                                        <ul className="list-unstyled m-0 d-flex flex-column gap-3">
                                            <li className="d-flex align-items-start gap-3 fs-14" style={{ color: '#334155' }}>
                                                <i className="ri-checkbox-circle-fill fs-18 mt-1" style={{ color: 'var(--primary-color, #0a192f)' }}></i>
                                                <span className="mt-1">Our automated underwriting engine will evaluate your application using your business profile, banking activity, and financial qualification data.</span>
                                            </li>
                                            <li className="d-flex align-items-start gap-3 fs-14" style={{ color: '#334155' }}>
                                                <i className="ri-checkbox-circle-fill fs-18 mt-1" style={{ color: 'var(--primary-color, #0a192f)' }}></i>
                                                <span className="mt-1">Any required supporting documents and banking information will be reviewed and verified during the underwriting process.</span>
                                            </li>
                                            <li className="d-flex align-items-start gap-3 fs-14" style={{ color: '#334155' }}>
                                                <i className="ri-checkbox-circle-fill fs-18 mt-1" style={{ color: 'var(--primary-color, #0a192f)' }}></i>
                                                <span className="mt-1">If additional information or documentation is needed, our team will contact you.</span>
                                            </li>
                                            <li className="d-flex align-items-start gap-3 fs-14" style={{ color: '#334155' }}>
                                                <i className="ri-checkbox-circle-fill fs-18 mt-1" style={{ color: 'var(--primary-color, #0a192f)' }}></i>
                                                <span className="mt-1">You will receive updates throughout the review process and be notified once a decision has been made.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="d-flex align-items-center justify-content-center gap-5 border-top pt-4 mx-auto">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9' }}>
                                                <i className="ri-calendar-line" style={{ color: '#475569', fontSize: '18px' }}></i>
                                            </div>
                                            <div className="text-start">
                                                <p className="fs-11 mb-0 fw-bold text-uppercase" style={{ color: '#64748b', letterSpacing: '0.5px' }}>Submitted On</p>
                                                <h6 className="fw-bold mb-0 text-dark fs-14">{submitDate}</h6>
                                            </div>
                                        </div>
                                        <div style={{ width: '1px', height: '40px', backgroundColor: '#e2e8f0' }}></div>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9' }}>
                                                <i className="ri-shield-user-line" style={{ color: '#475569', fontSize: '18px' }}></i>
                                            </div>
                                            <div className="text-start">
                                                <p className="fs-11 mb-0 fw-bold text-uppercase" style={{ color: '#64748b', letterSpacing: '0.5px' }}>Reviewed By</p>
                                                <h6 className="fw-bold mb-0 text-dark fs-14">{reviewerName}</h6>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* Navigation Buttons (Steps 1-3) */}
                            {currentStep < 4 && (
                                <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top">
                                    {currentStep > 1 ? (
                                        <button
                                            className="btn bg-white px-4 fw-medium d-flex align-items-center gap-2 shadow-none"
                                            style={{ border: '1px solid #e2e8f0', color: '#475569', borderRadius: '6px', padding: '10px 24px' }}
                                            onClick={handleBack}
                                            disabled={submitting}
                                        >
                                            <i className="ri-arrow-left-line"></i> Back
                                        </button>
                                    ) : (
                                        <button
                                            className="btn bg-white px-4 fw-medium d-flex align-items-center gap-2 shadow-none"
                                            style={{ border: '1px solid #e2e8f0', color: '#475569', borderRadius: '6px', padding: '10px 24px' }}
                                            onClick={() => navigate(-1)}
                                        >
                                            <i className="ri-arrow-left-line"></i> Cancel
                                        </button>
                                    )}

                                    {currentStep < 3 ? (
                                        <button
                                            className="d-flex align-items-center justify-content-center gap-2 text-white"
                                            style={{ backgroundColor: 'var(--primary-color, #0a192f)', border: '1px solid var(--primary-color, #0a192f)', padding: '10px 24px', borderRadius: '6px', fontWeight: 500 }}
                                            onClick={handleNext}
                                        >
                                            {currentStep === 1 ? 'Continue to Application' : 'Continue to Documents'} <i className="ri-arrow-right-line" style={{ fontSize: '18px' }}></i>
                                        </button>
                                    ) : (
                                        <button
                                            className="d-flex align-items-center justify-content-center gap-2 text-white fw-medium"
                                            style={{ backgroundColor: 'var(--primary-color, #0a192f)', border: '1px solid var(--primary-color, #0a192f)', padding: '10px 24px', borderRadius: '6px' }}
                                            onClick={handleSubmit}
                                            disabled={submitting || (isDocsRequired && missingDocs.length > 0)}
                                        >
                                            {submitting ? (
                                                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Submitting...</>
                                            ) : (
                                                'Submit for Underwriting'
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Navigation Buttons (Step 4) */}
                            {currentStep === 4 && (
                                <div className="d-flex flex-column align-items-center mx-auto mt-4" style={{ maxWidth: '480px' }}>
                                    <button
                                        className="btn w-100 mb-3 fw-bold text-white d-flex align-items-center justify-content-center gap-2"
                                        style={{ backgroundColor: 'var(--primary-color, #0a192f)', borderColor: 'var(--primary-color, #0a192f)', padding: '12px' }}
                                        onClick={() => navigate('/funding-requests')}
                                    >
                                        <i className="ri-bar-chart-fill fs-16"></i> View Review Status
                                    </button>
                                    <button
                                        className="btn btn-link text-decoration-none fw-bold d-flex align-items-center gap-2"
                                        style={{ color: 'var(--primary-color, #0a192f)' }}
                                        onClick={() => navigate('/funding')}
                                    >
                                        <i className="ri-arrow-left-line"></i> Return to Funding
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FundingRequestWizard;
