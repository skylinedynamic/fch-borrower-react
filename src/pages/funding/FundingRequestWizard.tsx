import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { toast } from 'react-toastify';
import { fetchFundingDetail, fetchReadinessFactors } from '../../modules/funding/services';
import WizardLoader from '../../components/Loader/WizardLoader';
import { useDocumentTypes, useBorrowerDocuments } from '../../modules/documents';
import { FileManagerModal } from '../../components/FileManagerModal/FileManagerModal';
import { submitFileSelection } from '../../modules/filemanager/services';
import DeleteConfirmationModal from '../../components/GlobalModal/DeleteConfirmModal';
import type { FileSystemItem } from '../../modules/filemanager/types';
import { PdfIcon, FileIcon } from '../../components/FileManagerModal/Icons';
import '../../../assets/css/funding.css';
import { getUser } from '../../lib/auth/auth';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/http';
import { queryKeys } from '../../lib/query';
import { useBusinessDetails, useFinancialInfo } from '../../modules/profile/queries';
import { FUNDING_WIZARD_STEPS, FUNDING_REVIEW_STATUS, FACTOR_STATUS_VALUES } from '../../config/funding';
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
    const isRedirecting = React.useRef(false);

    const branding = useBrandingStore((state: any) => state.branding);
    const [dynamicReviewerName, setDynamicReviewerName] = useState('');
    const reviewerName = dynamicReviewerName || branding?.site_name || 'Four Corner Holding';

    const { state, search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const initialAmount = state?.amount || searchParams.get('amount') || '';
    const initialPurpose = state?.purpose || searchParams.get('purpose') || '';

    const [formData, setFormData] = useState({
        requested_amount: initialAmount ? String(initialAmount).replace(/[^0-9.]/g, '') : '',
        use_of_funds: initialPurpose ? (typeof initialPurpose === 'string' ? initialPurpose.split(',').map((s: string) => s.trim()) : initialPurpose) : [],
    });
    const [errors, setErrors] = useState<any>({});

    const [missingDocs, setMissingDocs] = useState<string[]>([]);
    const [showFileManager, setShowFileManager] = useState(false);
    const [currentDocType, setCurrentDocType] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<{ id: number; name: string } | null>(null);

    const { data: documentsData } = useBorrowerDocuments();

    const deleteFundingDocumentMutation = useMutation({
        mutationFn: async (documentId: number) => {
            const res = await apiClient.delete(`/borrower/funding/requests/documents/${documentId}?funding_sequence_id=${id}`);
            return res.data;
        }
    });

    const { data: documentTypes } = useDocumentTypes();
    const queryClient = useQueryClient();
    const { data: businessRes } = useBusinessDetails();
    const { data: financialRes } = useFinancialInfo();

    const businessDetails = businessRes?.data || businessRes || {};
    const financialInfo = financialRes?.data || financialRes || {};


    const parsedUses = React.useMemo(() => {
        if (!fundingDetail?.uses) return [];
        try {
            const usesArray = typeof fundingDetail.uses === 'string' ? JSON.parse(fundingDetail.uses) : fundingDetail.uses;
            if (Array.isArray(usesArray)) {
                return usesArray.map((u: any) => {
                    if (typeof u === 'object' && u !== null) {
                        const val = u.value || u.name || u.label;
                        const lbl = u.label || u.name || u.value;
                        return { value: String(val), label: String(lbl) };
                    }
                    return { value: String(u), label: String(u) };
                }).filter((item: any) => item.label && item.value);
            }
        } catch (e) {
            console.error(e);
        }
        return [];
    }, [fundingDetail?.uses]);

    const fetchFactors = (fundingId: string) => {
        Promise.all([
            fetchFundingDetail(fundingId),
            fetchReadinessFactors(fundingId).catch(() => ({ status: false, data: [] }))
        ]).then(([res, readinessRes]) => {
            if (res.status) {
                setFundingDetail(res.data);
                let combinedDocs = [...(res.data.missing_documents || [])];
                if (readinessRes?.status && Array.isArray(readinessRes.data)) {
                    const extractedDocs = readinessRes.data
                        .filter((f: any) => f.missing_docs && f.missing_docs.length > 0)
                        .flatMap((f: any) => f.missing_docs);
                    combinedDocs = [...extractedDocs, ...combinedDocs];
                }
                setMissingDocs(Array.from(new Set(combinedDocs)));
            }
        }).catch(err => console.error(err));
    };

    useEffect(() => {
        if (id && !isRedirecting.current) {
            Promise.all([
                fetchFundingDetail(id),
                fetchReadinessFactors(id as string).catch(() => ({ status: false, data: [] }))
            ]).then(([res, readinessRes]) => {
                if (res.status) {
                    const engineStatus = res.data.engine_status;
                    const isHidden = engineStatus === 'Hidden';

                    let hasMissingFactors = false;
                    if (readinessRes?.status && Array.isArray(readinessRes.data)) {
                        hasMissingFactors = readinessRes.data.some((f: any) => {
                            const s = (f.status || '').toLowerCase();
                            return s === FACTOR_STATUS_VALUES.FAILED || s === FACTOR_STATUS_VALUES.RESTRICTED || s === FACTOR_STATUS_VALUES.WEAK;
                        });
                    } else if (res.data.readiness_factors) {
                        hasMissingFactors = res.data.readiness_factors.some((f: any) => {
                            const s = (f.status || '').toLowerCase();
                            return s === FACTOR_STATUS_VALUES.FAILED || s === FACTOR_STATUS_VALUES.RESTRICTED || s === FACTOR_STATUS_VALUES.WEAK;
                        });
                    }

                    if (res.data.latest_review_status === FUNDING_REVIEW_STATUS.PENDING) {
                        if (!isRedirecting.current) {
                            isRedirecting.current = true;
                            toast.warning('Already applied. Please wait for approval or rejection.');
                            navigate(`/funding/${id}`, { replace: true });
                        }
                        return;
                    }

                    if (res.data.latest_review_status === FUNDING_REVIEW_STATUS.APPROVED) {
                        if (!isRedirecting.current) {
                            isRedirecting.current = true;
                            toast.success('Your funding request is already approved! Please proceed with the application.');
                            navigate('/fund-application', {
                                replace: true,
                                state: {
                                    purpose: initialPurpose,
                                    amount: initialAmount,
                                    requested_amount: initialAmount,
                                    approved_funding: res.data.name || res.data.funding_type,
                                    funding_type: res.data.funding_type || res.data.name,
                                    funding_sequence_id: id,
                                    funding_request_id: res.data.latest_review_id,
                                }
                            });
                        }
                    }

                    if (isHidden || hasMissingFactors) {
                        if (!isRedirecting.current) {
                            isRedirecting.current = true;
                            toast.warning('You are not currently eligible for this funding option.');
                            navigate(`/funding/${id}`, { replace: true });
                        }
                        return;
                    }

                    setFundingDetail(res.data);
                    let combinedDocs = [...(res.data.missing_documents || [])];
                    if (readinessRes?.status && Array.isArray(readinessRes.data)) {
                        const extractedDocs = readinessRes.data
                            .filter((f: any) => f.missing_docs && f.missing_docs.length > 0)
                            .flatMap((f: any) => f.missing_docs);
                        combinedDocs = [...extractedDocs, ...combinedDocs];
                    }
                    setMissingDocs(Array.from(new Set(combinedDocs)));

                    setFormData(prev => {
                        let parsedUsesArray: any[] = [];
                        try {
                            parsedUsesArray = typeof res.data.uses === 'string' ? JSON.parse(res.data.uses) : res.data.uses;
                        } catch (e) { }
                        let defaultUse = '';
                        if (Array.isArray(parsedUsesArray) && parsedUsesArray.length > 0) {
                            const firstObj = parsedUsesArray[0];
                            defaultUse = typeof firstObj === 'object' ? (firstObj.value || firstObj.name || firstObj.label) : String(firstObj);
                        }

                        const newAmountRaw = prev.requested_amount || res.data.latest_requested_amount || '';
                        const newAmount = newAmountRaw ? String(newAmountRaw).replace(/[^0-9.]/g, '') : '';
                        let newPurpose: any = res.data.latest_use_of_funds || prev.use_of_funds;

                        if (!newPurpose || (Array.isArray(newPurpose) && newPurpose.length === 0)) {
                            if (Array.isArray(parsedUsesArray) && parsedUsesArray.length > 0) {
                                newPurpose = parsedUsesArray.map(u => typeof u === 'object' ? String(u.value || u.name || u.label) : String(u));
                            } else {
                                newPurpose = [];
                            }
                        }

                        if (typeof newPurpose === 'string') {
                            newPurpose = newPurpose ? newPurpose.split(',').map(s => s.trim()) : [];
                        } else if (!Array.isArray(newPurpose)) {
                            newPurpose = [];
                        }
                        return { ...prev, requested_amount: newAmount, use_of_funds: newPurpose };
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
                await submitFileSelection(filePaths, '/borrower/funding/requests/documents/upload', {
                    document_type_id: currentDocType.id,
                    funding_sequence_id: id
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

    const handleRemoveFile = (documentId: number, name: string) => {
        setDocumentToDelete({ id: documentId, name });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!documentToDelete) return;
        deleteFundingDocumentMutation.mutate(documentToDelete.id, {
            onSuccess: (response) => {
                toast.success(response?.message || 'Document deleted successfully');
                setShowDeleteModal(false);
                setDocumentToDelete(null);
                if (id) fetchFactors(id as string);
                queryClient.invalidateQueries({ queryKey: queryKeys.documents.list() });
            },
            onError: (error: any) => {
                console.error('Failed to delete document', error);
                toast.error(error.response?.data?.message || 'Failed to delete document');
            }
        });
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
                } else if (fundingDetail?.amount_range) {
                    const rangeStr = fundingDetail.amount_range;
                    const parts = rangeStr.split('-').map((p: string) => p.replace(/[^0-9.KMkm]/g, ''));
                    if (parts.length === 2) {
                        const parseVal = (val: string) => {
                            const p = val.trim().toUpperCase();
                            let num = parseFloat(p);
                            if (p.includes('K')) num *= 1000;
                            if (p.includes('M')) num *= 1000000;
                            return num;
                        };
                        let min = parseVal(parts[0]);
                        let max = parseVal(parts[1]);
                        if (!isNaN(min) && !isNaN(max)) {
                            const trueMin = Math.min(min, max);
                            const trueMax = Math.max(min, max);
                            if (amount < trueMin || amount > trueMax) {
                                newErrors.requested_amount = `Requested amount must be between $${trueMin.toLocaleString()} and $${trueMax.toLocaleString()}`;
                            }
                        }
                    }
                }
            }

            if (!formData.use_of_funds || formData.use_of_funds.length === 0) {
                newErrors.use_of_funds = 'Use of funds is required';
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
            const response = await apiClient.post('/borrower/funding/requests', {
                funding_sequence_id: fundingDetail.id,
                funding_type: fundingDetail.funding_type_name || fundingDetail.name,
                requested_amount: formData.requested_amount,
                use_of_funds: Array.isArray(formData.use_of_funds) ? formData.use_of_funds.join(', ') : formData.use_of_funds,
                documents_uploaded: requiredDocTypes.filter(t => !missingDocs.includes(t.name)).map(t => t.name),
                estimated_speed: fundingDetail.speed_to_funds
                    ? (fundingDetail.speed_to_funds.toLowerCase().includes('day') ? fundingDetail.speed_to_funds : `${fundingDetail.speed_to_funds} Days`)
                    : '1 - 7 Days'
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
        <div className="page-content funding-wizard-page">
            <FileManagerModal
                isOpen={showFileManager}
                toggle={() => setShowFileManager(!showFileManager)}
                section={currentDocType?.name || ''}
                selectionMode={true}
                onSelectFiles={handleFileSelection}
                entityType="borrowers"
                entityId={getUser()?.entity_id}
            />
            <DeleteConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                loading={deleteFundingDocumentMutation.isPending}
                text={`Are you sure you want to delete "${documentToDelete?.name}"? This action cannot be undone.`}
            />
            <div className="container-fluid">

                {/* ── Breadcrumb ─────────────────────────────────────────────── */}
                <div className="row page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between py-2">
                            <div className="flex-grow-1">
                                <h4 className="fs-20 mb-1 mt-0">Funding Request</h4>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link to="/funding">Funding Options</Link></li>
                                        <li className="breadcrumb-item"><Link to={`/funding/${id}`}>{fundingDetail?.name}</Link></li>
                                        <li className="breadcrumb-item active fw-medium" aria-current="page">Funding Request</li>
                                    </ol>
                                </nav>
                            </div>
                            <div className="mt-0 d-flex align-items-center">
                                <Link to="/funding" className="btn btn-primary fw-medium d-flex align-items-center gap-2 shadow-none px-4">
                                    <i className="ri-arrow-left-line"></i> Back
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto funding-wizard-container">

                    {/* Stepper Header */}
                    <div className="d-flex justify-content-center mb-5 pt-4">
                        <div className="d-flex align-items-center position-relative w-100 funding-wizard-stepper-container">
                            <div className="position-absolute funding-wizard-stepper-line"></div>
                            {steps.map((step, index) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                return (
                                    <React.Fragment key={step.id}>
                                        {index !== 0 && (
                                            <div className={`funding-wizard-stepper-spacer ${(currentStep > step.id || currentStep === step.id) ? 'active' : ''}`}></div>
                                        )}
                                        <div className="d-flex flex-column align-items-center position-relative funding-wizard-stepper-item">
                                            <div
                                                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold funding-wizard-step-circle ${isActive ? 'active' : (isCompleted ? 'completed' : '')}`}
                                            >
                                                {isCompleted ? <i className="ri-check-line"></i> : step.id}
                                            </div>
                                            <span
                                                className={`mt-2 position-absolute funding-wizard-step-label ${(isActive || isCompleted) ? 'active' : ''}`}
                                            >
                                                {step.label}
                                            </span>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 mt-5 rounded overflow-hidden">
                        <div className="card-body p-5">

                            {/* Step 1: Review Summary */}
                            {currentStep === 1 && (
                                <div>
                                    <h3 className="fw-bold mb-2 funding-wizard-text-dark">Funding Request Summary</h3>
                                    <p className="mb-4 fs-14 funding-wizard-text-muted">Please confirm your request details</p>

                                    <div className="border rounded p-4 mb-4 funding-wizard-border-panel">
                                        <div className="row align-items-center">
                                            <div className="col-md-7">
                                                <div className="mb-4">
                                                    <p className="fs-11 fw-bold text-uppercase mb-1 funding-wizard-text-light funding-wizard-letter-spacing">Funding Sequence</p>
                                                    <h5 className="fw-bold m-0 funding-wizard-text-dark">{fundingDetail.name}</h5>
                                                </div>
                                                <div className="mb-4">
                                                    <p className="fs-11 fw-bold text-uppercase mb-1 funding-wizard-text-light funding-wizard-letter-spacing">Funding Type</p>
                                                    <h6 className="fw-bold m-0 fs-14 funding-wizard-text-dark">{fundingDetail.funding_type_name || 'Financing'}</h6>
                                                </div>
                                                <div className="mb-4">
                                                    <p className="fs-11 fw-bold text-uppercase mb-1 funding-wizard-text-light funding-wizard-letter-spacing">Recommended Range</p>
                                                    <h6 className="fw-bold m-0 fs-14 funding-wizard-text-dark">{fundingDetail.amount_range || '$5K - $250K'}</h6>
                                                </div>
                                                <div>
                                                    <p className="fs-11 fw-bold text-uppercase mb-1 funding-wizard-text-light funding-wizard-letter-spacing">Est. Speed to Funds</p>
                                                    <h6 className="fw-bold m-0 fs-14 d-flex align-items-center gap-1 funding-wizard-text-dark">
                                                        {fundingDetail.speed_to_funds ? (fundingDetail.speed_to_funds.toLowerCase().includes('day') ? fundingDetail.speed_to_funds : `${fundingDetail.speed_to_funds} Days`) : '7-14 Days'}
                                                        <i className="ri-information-line fs-14 funding-wizard-text-light"></i>
                                                    </h6>
                                                </div>
                                            </div>
                                            <div className="col-md-5 d-flex flex-column align-items-center justify-content-center text-center">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 funding-wizard-icon-box">
                                                    <i className="ri-bank-card-line funding-wizard-icon-blue"></i>
                                                </div>
                                                <p className="fs-11 fw-bold text-uppercase mb-1 funding-wizard-text-light funding-wizard-letter-spacing">Use of Funds</p>
                                                <h6 className="fw-bold m-0 fs-14 funding-wizard-text-dark">{Array.isArray(formData.use_of_funds) && formData.use_of_funds.length > 0 ? formData.use_of_funds.join(', ') : 'Not Specified'}</h6>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row g-4 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fs-13 mb-2 funding-wizard-text-muted">Requested Amount</label>
                                            <div className={`input-group rounded funding-wizard-input-group ${errors.requested_amount ? 'error' : ''}`}>
                                                <span className="input-group-text bg-white funding-wizard-input-group-text">$</span>
                                                <input
                                                    type="text"
                                                    className={`form-control ps-2 shadow-none funding-wizard-input-field`}
                                                    placeholder="200,000"
                                                    value={
                                                        formData.requested_amount
                                                            ? formData.requested_amount.toString().split('.').map((p: string, i: number) => i === 0 ? p.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : p).join('.')
                                                            : ''
                                                    }
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/,/g, '');
                                                        if (/^\d*\.?\d*$/.test(rawValue)) {
                                                            setFormData({ ...formData, requested_amount: rawValue });
                                                            if (errors.requested_amount) setErrors({ ...errors, requested_amount: null });
                                                        }
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
                                                            <div className="d-flex align-items-start gap-2 mt-2 p-3 funding-wizard-alert-warning">
                                                                <i className="ri-error-warning-line fs-16 mt-1"></i>
                                                                <span className="fs-13"><strong>Please note:</strong> Your requested amount falls outside the required range of {rangeStr}.</span>
                                                            </div>
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fs-13 mb-2 funding-wizard-text-muted">Use of Funds</label>
                                            {parsedUses.length > 0 ? (
                                                <div className="input-group rounded funding-wizard-input-group bg-light opacity-75">
                                                    <input
                                                        type="text"
                                                        className="form-control border-0 bg-transparent fs-13 funding-wizard-input"
                                                        value={parsedUses.map(u => u.label).join(', ')}
                                                        disabled
                                                    />
                                                </div>
                                            ) : (
                                                <div className="funding-wizard-select-container">
                                                    <MultiSelect
                                                        value={formData.use_of_funds}
                                                        options={[
                                                            { label: 'Working Capital', value: 'Working Capital' },
                                                            { label: 'Equipment', value: 'Equipment' },
                                                            { label: 'Expansion', value: 'Expansion' },
                                                            { label: 'Other', value: 'Other' }
                                                        ]}
                                                        placeholder="Select Use of Funds"
                                                        optionLabel="label"
                                                        optionValue="value"
                                                        display="chip"
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, use_of_funds: e.value });
                                                            if (errors.use_of_funds) setErrors({ ...errors, use_of_funds: null });
                                                        }}
                                                        className="w-100 shadow-none border-0 slim-multiselect funding-wizard-multiselect bg-transparent"
                                                        panelStyle={{ backgroundColor: '#fff' }}
                                                    />
                                                </div>
                                            )}
                                            {errors.use_of_funds && <div className="text-danger fs-12 mt-1">{errors.use_of_funds}</div>}
                                        </div>
                                    </div>

                                    <div className="alert border-0 d-flex align-items-center gap-3 py-3 funding-wizard-alert-info">
                                        <i className="ri-information-fill fs-18 funding-wizard-alert-info-icon"></i>
                                        <span className="fs-13 funding-wizard-alert-info-text">This is not a credit decision. Final approval amount will be determined after underwriting.</span>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Application Summary */}
                            {currentStep === 2 && (
                                <div>
                                    <h4 className="fw-bold mb-2">Application Summary</h4>
                                    <p className="text-muted mb-4 fs-15">Please review your business information</p>

                                    <div className="alert alert-primary bg-primary-subtle border-0 d-flex align-items-center gap-3 py-3 mb-4 rounded">
                                        <i className="ri-information-line fs-18 text-primary"></i>
                                        <span className="fs-13 text-primary-emphasis">Please confirm that the information below is accurate. This information is sourced from your profile and cannot be edited here.</span>
                                    </div>

                                    <div className="row g-4 mb-2">
                                        {/* Business Information */}
                                        <div className="col-md-6">
                                            <div className="border rounded p-4 bg-white shadow-sm h-100">
                                                <div className="d-flex align-items-center gap-3 mb-4">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary funding-wizard-box-icon">
                                                        <i className="ri-building-line text-white fs-20"></i>
                                                    </div>
                                                    <h6 className="fw-bold m-0 text-uppercase funding-wizard-letter-spacing fwiz-section-title">Business Information</h6>
                                                </div>
                                                <div className="d-flex flex-column gap-3">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Legal Business Name</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.legal_business_name || businessDetails?.business_name || '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Business Structure</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.entity_type || businessDetails?.business_entity_type || '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Industry</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.industry || businessDetails?.business_industry_type || '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">EIN / Tax ID</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.tax_id || businessDetails?.business_ein || '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Business Phone</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.business_phone || '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Business Email</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.business_email || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Overview */}
                                        <div className="col-md-6">
                                            <div className="border rounded p-4 bg-white shadow-sm h-100">
                                                <div className="d-flex align-items-center gap-3 mb-4">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-success funding-wizard-box-icon">
                                                        <i className="ri-money-dollar-circle-line text-white fs-20"></i>
                                                    </div>
                                                    <h6 className="fw-bold m-0 text-uppercase funding-wizard-letter-spacing fwiz-section-title">Financial Overview</h6>
                                                </div>
                                                <div className="d-flex flex-column gap-3">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Annual Revenue</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{financialInfo?.annual_revenue ? `$${Number(financialInfo.annual_revenue).toLocaleString()}` : '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Monthly Revenue</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{financialInfo?.monthly_revenue ? `$${Number(financialInfo.monthly_revenue).toLocaleString()}` : '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Annual Personal Income</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{financialInfo?.annual_personal_income ? `$${Number(financialInfo.annual_personal_income).toLocaleString()}` : '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Avg Monthly Deposits</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{financialInfo?.average_monthly_deposits ? `$${Number(financialInfo.average_monthly_deposits).toLocaleString()}` : '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Monthly Deposit Count</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{financialInfo?.monthly_deposit_count ?? '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Avg Daily Balance (ADB)</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{financialInfo?.avg_bank_balance ? `$${Number(financialInfo.avg_bank_balance).toLocaleString()}` : '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Years in Business</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{financialInfo?.years_in_business || businessDetails?.time_in_business || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Address */}
                                        <div className="col-md-6">
                                            <div className="border rounded p-4 bg-white shadow-sm h-100">
                                                <div className="d-flex align-items-center gap-3 mb-4">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center funding-wizard-box-icon fwiz-icon-purple">
                                                        <i className="ri-map-pin-line fs-20"></i>
                                                    </div>
                                                    <h6 className="fw-bold m-0 text-uppercase funding-wizard-letter-spacing fwiz-section-title">Business Address</h6>
                                                </div>
                                                <div className="d-flex flex-column gap-3">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Address</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.business_address || '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Country</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.country || '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">State</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.business_state || '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">City</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.business_city || '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Zip Code</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.business_postal_code || '—'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Website</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{businessDetails?.business_website || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Funding Details */}
                                        <div className="col-md-6">
                                            <div className="border rounded p-4 bg-white shadow-sm h-100">
                                                <div className="d-flex align-items-center gap-3 mb-4">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning funding-wizard-box-icon">
                                                        <i className="ri-bank-card-line text-white fs-20"></i>
                                                    </div>
                                                    <h6 className="fw-bold m-0 text-uppercase funding-wizard-letter-spacing fwiz-section-title">Funding Details</h6>
                                                </div>
                                                <div className="d-flex flex-column gap-3">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Funding Type</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{fundingDetail.funding_type_name || fundingDetail.name}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Requested Amount</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">${Number(formData.requested_amount || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Use of Funds</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{Array.isArray(formData.use_of_funds) ? formData.use_of_funds.join(', ') : formData.use_of_funds}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Estimated Speed to Funds</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{fundingDetail.speed_to_funds ? `${fundingDetail.speed_to_funds} Days` : '1 - 7 Days'}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <span className="text-muted fs-13 funding-wizard-w-45">Recommended Range</span>
                                                        <span className="fw-medium fs-13 text-dark text-end funding-wizard-w-55">{fundingDetail.amount_range || '$10,000 - $250,000'}</span>
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
                                        <div className="alert border-0 d-flex align-items-center gap-3 py-3 mb-4 funding-wizard-success-panel">
                                            <i className="ri-checkbox-circle-fill fs-24 funding-wizard-primary-text"></i>
                                            <div>
                                                <h6 className="fw-bold mb-1 funding-wizard-primary-text">No Documents Required</h6>
                                                <span className="fs-13 text-muted">You do not need to upload any specific documents for this funding option. You can proceed directly to submit.</span>
                                            </div>
                                        </div>
                                    ) : requiredDocTypes.length === 0 ? (
                                        <div className="alert border-0 d-flex align-items-center gap-3 py-3 mb-4 funding-wizard-success-panel">
                                            <i className="ri-information-fill fs-24 funding-wizard-primary-text"></i>
                                            <div className="flex-grow-1">
                                                <h6 className="fw-bold mb-1 funding-wizard-primary-text">Supporting Documents Needed</h6>
                                                <span className="fs-13 text-muted">No specific documents are strictly required, but please upload relevant business documents (like Bank Statements) to help with underwriting.</span>
                                            </div>
                                            <button
                                                className="btn btn-sm px-3 fw-medium flex-shrink-0 text-white funding-wizard-primary-bg"
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
                                                        <div key={docType.id} className={`mb-3 border rounded p-3 bg-white ${!isMissing ? 'funding-wizard-border-primary' : 'funding-wizard-border-light'}`}>
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    {isMissing ? (
                                                                        <i className="ri-checkbox-blank-line text-muted fs-18"></i>
                                                                    ) : (
                                                                        <i className="ri-checkbox-fill fs-18 funding-wizard-primary-text"></i>
                                                                    )}
                                                                    <span className="fs-14 fw-medium text-dark">{docType.name}</span>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-3">
                                                                    {isMissing ? (
                                                                        <>
                                                                            <span className="text-danger fs-13 fw-semibold"><i className="ri-error-warning-fill align-middle me-1"></i> Missing</span>
                                                                            <button
                                                                                className="btn btn-primary btn-sm px-3 fw-medium shadow-none"
                                                                                onClick={() => {
                                                                                    setCurrentDocType(docType);
                                                                                    setShowFileManager(true);
                                                                                }}
                                                                                disabled={uploading}
                                                                            >
                                                                                {uploading && currentDocType?.id === docType.id ? (
                                                                                    <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Uploading...</>
                                                                                ) : (
                                                                                    <><i className="ri-upload-cloud-2-line align-middle me-1 fs-15"></i> Upload</>
                                                                                )}
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span className="fs-13 fw-semibold funding-wizard-primary-text"><i className="ri-check-line align-middle me-1"></i> Uploaded</span>

                                                                            {fundingDetail?.latest_review_status === 'Rejected' && (
                                                                                <button
                                                                                    className="btn btn-light border btn-sm px-3 fw-medium ms-2"
                                                                                    onClick={() => {
                                                                                        setCurrentDocType(docType);
                                                                                        setShowFileManager(true);
                                                                                    }}
                                                                                    disabled={uploading}
                                                                                >
                                                                                    {uploading && currentDocType?.id === docType.id ? (
                                                                                        <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Uploading...</>
                                                                                    ) : (
                                                                                        <><i className="ri-upload-cloud-2-line align-middle me-1 fs-15"></i> Upload Again</>
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {!isMissing && documentsData?.[docType.id]?.length > 0 && (
                                                                <div className="mt-3 pt-3 border-top">
                                                                    <div className="d-flex flex-column gap-2">
                                                                        {documentsData[docType.id].map((doc: any) => {
                                                                            const isPdf = doc.file_name.toLowerCase().endsWith('.pdf');
                                                                            return (
                                                                                <div key={doc.id} className="d-flex align-items-center justify-content-between border rounded px-2 py-2 bg-white">
                                                                                    <div className="d-flex align-items-center gap-3 overflow-hidden">
                                                                                        {isPdf ? (
                                                                                            <PdfIcon style={{ width: '28px', height: '28px' }} />
                                                                                        ) : (
                                                                                            <FileIcon style={{ width: '28px', height: '28px' }} className="text-muted" />
                                                                                        )}
                                                                                        <div className="d-flex flex-column">
                                                                                            <span className="fs-13 fw-medium text-truncate" title={doc.file_name} style={{ maxWidth: '300px' }}>{doc.file_name}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <button
                                                                                        className="btn btn-sm btn-outline-danger py-1 px-2 d-flex align-items-center gap-1"
                                                                                        onClick={() => handleRemoveFile(doc.id, doc.file_name)}
                                                                                        title="Remove document"
                                                                                        disabled={deleteFundingDocumentMutation.isPending}
                                                                                    >
                                                                                        <i className="ri-delete-bin-line fs-14"></i> <span className="fs-13">Remove</span>
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
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
                                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle funding-wizard-success-circle">
                                            <i className="ri-check-line fw-bolder funding-wizard-success-icon"></i>
                                        </div>
                                    </div>
                                    <h3 className="fw-bold mb-3 funding-wizard-text-dark">Funding Request Submitted!</h3>
                                    <p className="text-muted mb-4 fs-15 px-md-5">Your request has been received and is now under<br />{reviewerName} underwriting review.</p>

                                    <div className="border rounded p-4 text-start mx-auto mb-4 funding-wizard-panel-bg-light fwiz-review-panel">
                                        <h6 className="fw-bold mb-3 funding-wizard-primary-text">What Happens Next?</h6>
                                        <ul className="list-unstyled m-0 d-flex flex-column gap-3">
                                            <li className="d-flex align-items-start gap-3 fs-14 text-dark">
                                                <i className="ri-checkbox-circle-fill fs-18 mt-1 funding-wizard-primary-text"></i>
                                                <span className="mt-1">Our automated underwriting engine will evaluate your application using your business profile, banking activity, and financial qualification data.</span>
                                            </li>
                                            <li className="d-flex align-items-start gap-3 fs-14 text-dark">
                                                <i className="ri-checkbox-circle-fill fs-18 mt-1 funding-wizard-primary-text"></i>
                                                <span className="mt-1">Any required supporting documents and banking information will be reviewed and verified during the underwriting process.</span>
                                            </li>
                                            <li className="d-flex align-items-start gap-3 fs-14 text-dark">
                                                <i className="ri-checkbox-circle-fill fs-18 mt-1 funding-wizard-primary-text"></i>
                                                <span className="mt-1">If additional information or documentation is needed, our team will contact you.</span>
                                            </li>
                                            <li className="d-flex align-items-start gap-3 fs-14 text-dark">
                                                <i className="ri-checkbox-circle-fill fs-18 mt-1 funding-wizard-primary-text"></i>
                                                <span className="mt-1">You will receive updates throughout the review process and be notified once a decision has been made.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="d-flex align-items-center justify-content-center gap-5 border-top pt-4 mx-auto">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="d-flex align-items-center justify-content-center rounded-circle funding-wizard-box-icon bg-light">
                                                <i className="ri-calendar-line text-secondary fs-18"></i>
                                            </div>
                                            <div className="text-start">
                                                <p className="fs-11 mb-0 fw-bold text-uppercase funding-wizard-text-light funding-wizard-letter-spacing">Submitted On</p>
                                                <h6 className="fw-bold mb-0 text-dark fs-14">{submitDate}</h6>
                                            </div>
                                        </div>
                                        <div className="fwiz-divider"></div>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="d-flex align-items-center justify-content-center rounded-circle funding-wizard-box-icon bg-light">
                                                <i className="ri-shield-user-line text-secondary fs-18"></i>
                                            </div>
                                            <div className="text-start">
                                                <p className="fs-11 mb-0 fw-bold text-uppercase funding-wizard-text-light funding-wizard-letter-spacing">Reviewed By</p>
                                                <h6 className="fw-bold mb-0 text-dark fs-14">{reviewerName}</h6>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* Navigation Buttons (Steps 1-3) */}
                            {currentStep < 4 && (
                                <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top fwiz-nav-buttons">
                                    {currentStep > 1 ? (
                                        <button
                                            className="btn btn-light border fw-medium d-flex align-items-center gap-2 shadow-none px-4"
                                            onClick={handleBack}
                                            disabled={submitting}
                                        >
                                            <i className="ri-arrow-left-line"></i> Back
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-light border fw-medium d-flex align-items-center gap-2 shadow-none px-4"
                                            onClick={() => navigate(-1)}
                                        >
                                            <i className="ri-arrow-left-line"></i> Cancel
                                        </button>
                                    )}

                                    {currentStep < 3 ? (
                                        <button
                                            className="btn btn-primary d-flex align-items-center justify-content-center gap-2 fw-medium px-4"
                                            onClick={handleNext}
                                        >
                                            {currentStep === 1 ? 'Continue to Funding Request' : 'Continue to Documents'} <i className="ri-arrow-right-line"></i>
                                        </button>
                                    ) : (
                                        <span style={(submitting || (isDocsRequired && missingDocs.length > 0)) ? { cursor: 'not-allowed', display: 'inline-block' } : {}}>
                                            <button
                                                className={`btn btn-primary d-flex align-items-center justify-content-center gap-2 fw-medium px-4`}
                                                style={(submitting || (isDocsRequired && missingDocs.length > 0)) ? { opacity: 0.5, pointerEvents: 'none' } : {}}
                                                onClick={handleSubmit}
                                                disabled={submitting || (isDocsRequired && missingDocs.length > 0)}
                                            >
                                                {submitting ? (
                                                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Submitting...</>
                                                ) : (
                                                    <>Submit for Underwriting <i className="ri-arrow-right-line"></i></>
                                                )}
                                            </button>
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Navigation Buttons (Step 4) */}
                            {currentStep === 4 && (
                                <div className="d-flex flex-row align-items-center justify-content-center gap-3 mx-auto mt-4 fwiz-success-buttons">
                                    <button
                                        className="btn btn-primary d-flex align-items-center justify-content-center gap-2 fw-medium px-4 shadow-none"
                                        onClick={() => navigate('/funding')}
                                    >
                                        <i className="ri-arrow-left-line"></i> Return to Funding
                                    </button>
                                    <button
                                        className="btn btn-primary d-flex align-items-center justify-content-center gap-2 fw-medium px-4 shadow-none"
                                        onClick={() => navigate('/funding-requests')}
                                    >
                                        <i className="ri-bar-chart-fill"></i> View Review Status
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
