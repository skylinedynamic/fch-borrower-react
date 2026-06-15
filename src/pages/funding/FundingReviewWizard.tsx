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
import { FUNDING_WIZARD_STEPS } from '../../config/funding';
    const steps = FUNDING_WIZARD_STEPS;

const FundingReviewWizard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [fundingDetail, setFundingDetail] = useState<any>(null);
    const [reviewId, setReviewId] = useState('');
    const [submitDate, setSubmitDate] = useState('');

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
        fetchReadinessFactors(fundingId).then(res => {
            if (res.status) {
                const docFactor = res.data.find((f: any) => f.type === 'documents');
                if (docFactor && docFactor.missing_docs) {
                    setMissingDocs(docFactor.missing_docs);
                } else {
                    setMissingDocs([]);
                }
            }
        }).catch(err => console.error(err));
    };

    useEffect(() => {
        if (id) {
            fetchFundingDetail(id)
                .then(res => {
                    if (res.status) {
                        setFundingDetail(res.data);
                        fetchFactors(id);
                        
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
            } else if (Number(formData.requested_amount) < 0) {
                newErrors.requested_amount = 'Requested amount cannot be negative';
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
            setReviewId(response.data.data?.id ? `FR-2024-${String(response.data.data.id).padStart(5, '0')}` : 'FR-2024-000158');
            setSubmitDate(response.data.data?.created_at || new Date().toLocaleString());
            setCurrentStep(4);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit funding review');
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
                                <h4 className="fs-20 mb-1">Funding Review</h4>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link to="/funding">Funding Options</Link></li>
                                        <li className="breadcrumb-item"><Link to={`/funding/${id}`}>{fundingDetail?.name}</Link></li>
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
                                        <div style={{ flex: 1, height: '2px', backgroundColor: (currentStep > step.id || currentStep === step.id) ? '#2563eb' : 'transparent', zIndex: 1 }}></div>
                                    )}
                                    <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2, background: '#f9fafb', padding: '0 10px' }}>
                                        <div
                                            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold`}
                                            style={{
                                                width: isActive ? '40px' : '32px',
                                                height: isActive ? '40px' : '32px',
                                                fontSize: isActive ? '16px' : (isCompleted ? '18px' : '14px'),
                                                backgroundColor: isActive ? '#2563eb' : '#fff',
                                                color: isActive ? '#fff' : (isCompleted ? '#2563eb' : '#6b7280'),
                                                border: isActive ? 'none' : (isCompleted ? '1px solid #2563eb' : '1px solid #d1d5db'),
                                                boxShadow: isActive ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : 'none',
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
                                                fontWeight: isActive ? 600 : 500,
                                                color: isActive || isCompleted ? '#111827' : '#6b7280',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                    {index !== steps.length - 1 && (
                                        <div style={{ flex: 1, height: '2px', backgroundColor: currentStep > step.id ? '#2563eb' : 'transparent', zIndex: 1 }}></div>
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
                                            <span className={`input-group-text bg-white ${errors.requested_amount ? 'border-danger' : 'border-end-0'}`}>$</span>
                                            <input
                                                type="number"
                                                className={`form-control border-start-0 ps-0 ${errors.requested_amount ? 'border-danger' : ''}`}
                                                placeholder="e.g. 50000"
                                                value={formData.requested_amount}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, requested_amount: e.target.value });
                                                    if (errors.requested_amount) setErrors({ ...errors, requested_amount: null });
                                                }}
                                            />
                                        </div>
                                        {errors.requested_amount && <div className="text-danger fs-12 mt-1">{errors.requested_amount}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted fs-13">Use of Funds</label>
                                        <Dropdown
                                            value={formData.use_of_funds}
                                            options={[
                                                { label: 'Working Capital', value: 'Working Capital' },
                                                { label: 'Equipment', value: 'Equipment' },
                                                { label: 'Expansion', value: 'Expansion' },
                                                { label: 'Other', value: 'Other' }
                                            ]}
                                            onChange={(e) => setFormData({ ...formData, use_of_funds: e.value })}
                                            className="w-100 bg-light border-light"
                                            style={{ height: '38px' }}
                                        />
                                    </div>
                                </div>

                                <div className="alert alert-primary bg-primary-subtle border-0 d-flex align-items-center gap-3 py-3" style={{ borderRadius: '8px' }}>
                                    <i className="ri-information-line fs-18 text-primary"></i>
                                    <span className="fs-13 text-primary-emphasis">This is not a credit decision. Final approval amount will be determined after underwriting.</span>
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
                                    <div className="alert alert-success bg-success-subtle border-0 d-flex align-items-center gap-3 py-3 mb-4" style={{ borderRadius: '8px' }}>
                                        <i className="ri-checkbox-circle-fill fs-24 text-success"></i>
                                        <div>
                                            <h6 className="fw-bold mb-1 text-success-emphasis">No Documents Required</h6>
                                            <span className="fs-13 text-success-emphasis">You do not need to upload any specific documents for this funding option. You can proceed directly to submit.</span>
                                        </div>
                                    </div>
                                ) : requiredDocTypes.length === 0 ? (
                                    <div className="alert alert-primary bg-primary-subtle border-0 d-flex align-items-center gap-3 py-3 mb-4" style={{ borderRadius: '8px' }}>
                                        <i className="ri-information-fill fs-24 text-primary"></i>
                                        <div className="flex-grow-1">
                                            <h6 className="fw-bold mb-1 text-primary-emphasis">Supporting Documents Needed</h6>
                                            <span className="fs-13 text-primary-emphasis">No specific documents are strictly required, but please upload relevant business documents (like Bank Statements) to help with underwriting.</span>
                                        </div>
                                        <button
                                            className="btn btn-primary btn-sm px-3 fw-medium flex-shrink-0"
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
                                                    <div key={docType.id} className={`d-flex align-items-center justify-content-between mb-3 border rounded-3 p-3 bg-white ${!isMissing ? 'border-success-subtle' : ''}`}>
                                                        <div className="d-flex align-items-center gap-2">
                                                            {isMissing ? (
                                                                <i className="ri-checkbox-blank-line text-muted fs-18"></i>
                                                            ) : (
                                                                <i className="ri-checkbox-fill text-success fs-18"></i>
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
                                                                <span className="text-success fs-13 fw-semibold"><i className="ri-check-line align-middle me-1"></i> Uploaded</span>
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
                                <div className="mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center bg-success-subtle rounded-circle" style={{ width: '80px', height: '80px' }}>
                                        <i className="ri-check-line text-success" style={{ fontSize: '40px' }}></i>
                                    </div>
                                </div>
                                <h3 className="fw-bold mb-3">Funding Review Submitted!</h3>
                                <p className="text-muted mb-4 fs-15 px-md-5">Your request has been received and is now under<br />FCH underwriting review.</p>

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
                                        {currentStep === 1 ? 'Continue to Application' : 'Continue to Documents'} <i className="ri-arrow-right-line"></i>
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary px-4 fw-medium"
                                        onClick={handleSubmit}
                                        disabled={submitting || (isDocsRequired && missingDocs.length > 0)}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit for Underwriting'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons (Step 4) */}
                        {currentStep === 4 && (
                            <div className="d-flex flex-column align-items-center mx-auto mt-4" style={{ maxWidth: '400px' }}>
                                <button 
                                    className="btn w-100 mb-3 fw-medium text-white" 
                                    style={{ backgroundColor: '#00204a', borderColor: '#00204a', padding: '10px' }}
                                    onClick={() => navigate('/funding-reviews')}
                                >
                                    View Review Status
                                </button>
                                <button 
                                    className="btn btn-link text-muted text-decoration-none fw-medium" 
                                    onClick={() => navigate('/funding')}
                                >
                                    Return to Funding Options
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

export default FundingReviewWizard;
