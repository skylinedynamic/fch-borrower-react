import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

// Components
import BusinessInformationStep from './components/steps/BusinessInformationStep'
import OwnershipInformationStep from './components/steps/OwnershipInformationStep'
import FinancialInformationStep from './components/steps/FinancialInformationStep'
import FundingRequestStep from './components/steps/FundingRequestStep'
import DocumentUploadStep from './components/steps/DocumentUploadStep'
import DisclosuresStep from './components/steps/DisclosuresStep'
import FederalComplianceStep from './components/steps/FederalComplianceStep'
import AttestationStep from './components/steps/AttestationStep'
import CoBorrowerModal from './components/shared/CoBorrowerModal'
import EditConfirmationModal from './components/shared/EditConfirmationModal'

// Hooks
import { useCoBorrowers } from './hooks/useCoBorrowers'
import { FUNDING_PURPOSE_OTHER, purposeOfFundingOptions, timeframeOptions, withoutPreferredFundingType } from '../../data/profile'
import { useFundingRequest, useFundingApplicationDocuments } from '../../modules/funding-application/queries'
import { setEditRequiresConfirmation, setEditConfirmationResolving, resetEditConfirmation } from '../../store/fundApplication/editConfirmationStore'
import { formatCurrency } from '../../utils/formatters'
import { STEP_INDICES, isWizardStepComplete } from './stepProgress'

// Types & Utils
import {
  tabs,
  disclosureItems,
  type PersonalInfo,
  type BusinessDetails,
  type OwnerInfo,
  type FinancialInfo,
  type FundingRequest,
  type DisclosureConsent,
  type FederalCompliance,
  type Attestation,
} from './types'

const matchPurpose = (raw: string | null | undefined): string => {
  if (!raw) return ''
  const trimmed = raw.trim()

  if (trimmed.includes(',')) {
    return trimmed
  }

  const exact = purposeOfFundingOptions.find(o => o.value.toLowerCase() === trimmed.toLowerCase())
  if (exact) return exact.value

  const lowerAll = trimmed.toLowerCase()
  if (lowerAll === 'working capital') return 'Working Capital'
  if (lowerAll.includes('equipment')) return 'Equipment Purchase'
  if (lowerAll.includes('inventory')) return 'Inventory'
  if (lowerAll.includes('payroll')) return 'Payroll'
  if (lowerAll.includes('real estate') || lowerAll.includes('property')) return 'Commercial Real Estate Purchase'
  if (lowerAll.includes('line of credit')) return 'Business Line of Credit'
  if (lowerAll.includes('expansion')) return 'Business Expansion'
  if (lowerAll.includes('acquisition')) return 'Business Acquisition'

  return trimmed
}

const matchTimeframe = (raw: string | null | undefined): string => {
  if (!raw) return ''
  const trimmed = raw.trim()
  const exact = timeframeOptions.find(o => o.value.toLowerCase() === trimmed.toLowerCase())
  if (exact) return exact.value

  const lower = trimmed.toLowerCase()
  if (lower.includes('hour') || lower.includes('1-3 day') || lower.includes('1-5 day') || lower.includes('3-7 day') || lower.includes('immediately')) {
    return 'Immediately'
  }
  if (lower.includes('7-14') || lower.includes('1-2 week') || lower.includes('2 week')) {
    return '1-2 Weeks'
  }
  if (lower.includes('21-45') || lower.includes('30-60') || lower.includes('month')) {
    return '1 Month'
  }
  if (lower.includes('flexible')) {
    return 'Flexible'
  }
  return trimmed
}

// Constants
const INITIAL_LOADING_DELAY_MS = 700

// Federal compliance question keys for validation
const FEDERAL_COMPLIANCE_KEYS: (keyof FederalCompliance)[] = [
  'bankruptcy',
  'lawsuit',
  'federalLoanDefault',
  'federalDebtDelinquent',
  'criminalOffense',
  'paroleProbation',
  'suspendedDebarred',
  'judgmentsLiensBusiness',
  'judgmentsLiensOwner',
]

export default function FundApplication() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const [fundingSequenceId, setFundingSequenceId] = useState<string | number | null>(null)
  const [fundingRequestId, setFundingRequestId] = useState<string | number | null>(null)

  const [activeStep, setActiveStep] = useState<number>(STEP_INDICES.BUSINESS_INFO)
  const [highestVisitedStep, setHighestVisitedStep] = useState<number>(STEP_INDICES.BUSINESS_INFO)
  const [loading, setLoading] = useState(true)
  const [isNavigatingSave, setIsNavigatingSave] = useState(false)
  const [mobileOpenIdx, setMobileOpenIdx] = useState<number | null>(STEP_INDICES.BUSINESS_INFO)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeStepSaveRef = React.useRef<(() => Promise<boolean>) | null>(null)

  // Co-borrower hook
  const {
    coBorrowers,
    setCoBorrowers,
    coDraft,
    setCoDraft,
    addCoBorrower,
    submitCoBorrower,
    deleteCoBorrower,
    editCoBorrower,
    isEditing,
    editIndex,
  } = useCoBorrowers()

  // Form State
  const [personal, setPersonal] = useState<PersonalInfo>({
    fullName: '',
    businessName: '',
    email: '',
    phoneCountry: 'USA (+1)',
    phoneNumber: '',
  })

  const [business, setBusiness] = useState<BusinessDetails>({
    businessName: '',
    businessAddress: '',
    city: '',
    state: '',
    incorporationState: '',
    zip: '',
    industryType: '',
    entityType: '',
    yearsInBusiness: '',
    employees: '',
  })

  const [owner, setOwner] = useState<OwnerInfo>({
    firstName: '',
    lastName: '',
    dob: '',
    ssn: '',
    citizenship: '',
    streetAddress: '',
    country: 'United States',
    city: '',
    state: '',
    zip: '',
    ownershipPct: '',
    hasCoBorrower: false,
    phoneNumber: '',
  })

  // What the owner and the other co-borrowers already hold - the one being
  // edited is left out - so adding a co-borrower is refused when the share
  // would pass 100%, not only at Save & Next (BUG-108).
  const otherOwnershipTotal = (Number(owner.ownershipPct) || 0) +
    coBorrowers.reduce((sum, cb, idx) => (idx === editIndex ? sum : sum + (Number(cb.ownershipPct) || 0)), 0)

  const [financial, setFinancial] = useState<FinancialInfo>({
    monthlyRevenue: '',
    annualRevenue: '',
    bankName: '',
    checkingStartDate: '',
    personalCreditScore: '',
    businessCreditScore: '',
    existingDebt: false,
    debtBalance: '',
  })

  const [funding, setFunding] = useState<FundingRequest>({
    requestedAmount: '',
    purpose: '',
    approvedFunding: '',
    fundingType: '',
    additionalFundingTypes: [],
    timeframe: '',
    collateral: '',
    purposeNote: '',
  })

  // Initialize funding state from location.state & query params
  useEffect(() => {
    const state = location.state as any;
    const searchParams = new URLSearchParams(window.location.search);
    const seqId = state?.funding_sequence_id ?? state?.fundingSequenceId ?? searchParams.get('funding_sequence_id') ?? searchParams.get('fundingSequenceId');
    const reqId = id ?? state?.funding_request_id ?? state?.fundingRequestId ?? searchParams.get('funding_request_id') ?? searchParams.get('fundingRequestId');

    if (seqId) setFundingSequenceId(seqId);
    if (reqId) setFundingRequestId(reqId);

    if (state && (state.purpose || state.approved_funding || state.requested_amount || state.funding_type)) {
      setFunding(prev => {
        let matchedPurpose = state.purpose ? matchPurpose(state.purpose) : prev.purpose;

        return {
          ...prev,
          purpose: matchedPurpose,
          approvedFunding: state.approved_funding || prev.approvedFunding,
          requestedAmount: state.requested_amount ? formatCurrency(state.requested_amount) : prev.requestedAmount,
          fundingType: state.funding_type || prev.fundingType,
        };
      })
    }
  }, [location.state, id])

  const [federal, setFederal] = useState<FederalCompliance>({
    legalBusinessName: '',
    ein: '',
    country: '',
    ofacResult: '',
    patriotActAck: false,
    fcraAuth: false,
    ecoaAck: false,
    bankruptcy: 'no',
    lawsuit: 'no',
    federalLoanDefault: 'no',
    federalDebtDelinquent: 'no',
    criminalOffense: 'no',
    paroleProbation: 'no',
    suspendedDebarred: 'no',
    judgmentsLiensBusiness: 'no',
    judgmentsLiensOwner: 'no',
    explanation: '',
  })

  const [disclosure, setDisclosure] = useState<DisclosureConsent>({
    agreeTerms: false,
    creditCheckConsent: false,
    eSignConsent: false,
    authorizeVerification: false,
    marketingOptIn: false,
  })

  const [attestation, setAttestation] = useState<Attestation>({
    certify: false,
    signature_name: '',
    esign_consent: false,
    terms_consent: false,
    privacy_consent: false,
    credit_consent: false,
    legal_binding_consent: false
  })

  // Fetch funding request and documents (tab-wise lazy loading)
  const currentReqId = fundingRequestId || id || null
  const { data: fundingData, isLoading: isFundingDataLoading, error: fundingDataError } = useFundingRequest(currentReqId)
  // The API answers 404 for a funding request that is not this borrower's
  // (BUG-082): the wizard is not shown for it at all.
  const isForeignRequest = (fundingDataError as any)?.response?.status === 404
  const fundingApplicationId = fundingData?.id ?? null
  const { data: documentsData } = useFundingApplicationDocuments(fundingApplicationId, {
    enabled: !!fundingApplicationId,
  })

  // Synchronize funding data when fetched from API
  useEffect(() => {
    if (fundingData) {
      const rawAmount = fundingData.requested_amount
      const parsedAmount = rawAmount ? formatCurrency(rawAmount) : ''
      const rawPurpose = fundingData.purpose_of_funds
      const resolvedPurpose = matchPurpose(rawPurpose)
      const resolvedApproved = fundingData.approved_funding || ''
      const resolvedType = fundingData.preferred_funding_type || ''
      const resolvedTimeframe = matchTimeframe(fundingData.timeframe_needed)

      setFunding({
        requestedAmount: parsedAmount,
        purpose: resolvedPurpose,
        approvedFunding: resolvedApproved,
        fundingType: resolvedType,
        additionalFundingTypes: withoutPreferredFundingType(fundingData.additional_funding_types, resolvedType),
        timeframe: resolvedTimeframe,
        collateral: fundingData.collateral_available || '',
        purposeNote: fundingData.purpose_note || '',
      })

      if (fundingData.funding_sequence_id) {
        setFundingSequenceId(fundingData.funding_sequence_id)
      }
      if (fundingData.funding_request_id) {
        setFundingRequestId(fundingData.funding_request_id)
      }
    }
  }, [fundingData])

  // Initial loading effect
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), INITIAL_LOADING_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  // Sync mobile accordion with active step
  useEffect(() => {
    setMobileOpenIdx(activeStep)
  }, [activeStep])

  // Callback for steps to register their save function
  const registerSave = useCallback((fn: (() => Promise<boolean>) | null) => {
    activeStepSaveRef.current = fn
  }, [])

  // Validation: Check if business info step can proceed
  const canProceedFromBusinessInfo = useMemo((): boolean => {
    return Boolean(
      personal.fullName &&
      personal.businessName &&
      personal.email &&
      personal.phoneNumber &&
      business.businessName &&
      business.businessAddress &&
      business.city &&
      business.state &&
      business.incorporationState &&
      business.zip &&
      business.industryType &&
      business.entityType &&
      business.yearsInBusiness
    )
  }, [personal, business])

  // Validation: Check if a specific step is valid
  const isStepValid = useCallback(
    (stepIndex: number): boolean => {
      // Helper to check backend save state
      const checkBackendSaved = (idx: number) => {
        if (idx === STEP_INDICES.BUSINESS_INFO) return !!fundingData?.is_business_info_saved;
        if (idx === STEP_INDICES.OWNERSHIP_INFO) return !!fundingData?.is_ownership_info_saved;
        if (idx === STEP_INDICES.FINANCIAL_INFO) return !!fundingData?.is_financial_info_saved;
        if (idx === STEP_INDICES.FUNDING_REQUEST) return !!fundingData?.is_funding_request_saved;
        if (idx === STEP_INDICES.DISCLOSURES) return !!fundingData?.is_disclosures_saved;
        if (idx === STEP_INDICES.FEDERAL_COMPLIANCE) return !!fundingData?.is_federal_compliance_saved;
        if (idx === STEP_INDICES.ATTESTATION) return !!fundingData?.signature_data;
        return false;
      };

      // If we're not currently on this tab and the backend says it's saved, assume it's valid.
      // This prevents unmounted tabs with empty local state from incorrectly reporting as invalid.
      if (activeStep !== stepIndex && checkBackendSaved(stepIndex)) {
        return true;
      }

      switch (stepIndex) {
        case STEP_INDICES.BUSINESS_INFO:
          return canProceedFromBusinessInfo

        case STEP_INDICES.OWNERSHIP_INFO:
          return Boolean(
            owner.firstName &&
            owner.lastName &&
            owner.dob &&
            owner.ssn &&
            owner.citizenship &&
            owner.streetAddress &&
            owner.city &&
            owner.state &&
            owner.zip &&
            owner.ownershipPct
          )

        case STEP_INDICES.FINANCIAL_INFO: {
          const baseFieldsValid = Boolean(
            financial.monthlyRevenue && financial.checkingStartDate && financial.personalCreditScore
          )
          const debtFieldValid = !financial.existingDebt || Boolean(financial.debtBalance)
          return baseFieldsValid && debtFieldValid
        }

        case STEP_INDICES.FUNDING_REQUEST:
          return Boolean(
            fundingData?.is_funding_request_saved &&
            funding.requestedAmount &&
            funding.purpose &&
            funding.fundingType &&
            (funding.purpose !== FUNDING_PURPOSE_OTHER || funding.purposeNote)
          )

        case STEP_INDICES.DOCUMENT_UPLOAD:
          // Document upload is optional (never blocks navigation)
          return true

        case STEP_INDICES.DISCLOSURES:
          return disclosureItems.every((item) => disclosure[item.key])

        case STEP_INDICES.FEDERAL_COMPLIANCE: {
          const anyYes = FEDERAL_COMPLIANCE_KEYS.some((key) => federal[key] === 'yes')
          const allAnswered = FEDERAL_COMPLIANCE_KEYS.every((key) => federal[key] === 'yes' || federal[key] === 'no')
          return allAnswered && (!anyYes || federal.explanation.trim().length > 0)
        }

        case STEP_INDICES.ATTESTATION:
          return Boolean(
            (attestation.signature_type === 'esign'
              ? attestation.signature_image
              : attestation.signature_name && attestation.signature_name.trim().length >= 3) &&
            attestation.esign_consent &&
            attestation.terms_consent &&
            attestation.privacy_consent &&
            attestation.credit_consent &&
            attestation.legal_binding_consent
          )

        default:
          return false
      }
    },
    [canProceedFromBusinessInfo, owner, financial, funding, disclosure, federal, attestation]
  )


  // Whether an edit currently costs the borrower their signature is the API's
  // call, not a status list held here - the server decides it and enforces it.
  // Feed it to the gate the step saves wait on, and clear the gate on unmount so
  // a stale flag cannot follow the borrower to another screen.
  //
  // Only a loaded application can answer. The request id changes type once the
  // application arrives, which refetches it; treating that gap as "not signed"
  // let saves through unasked and dismissed a dialog that had just opened.
  useEffect(() => {
    if (!fundingData) return
    setEditRequiresConfirmation(Boolean(fundingData.edit_needs_confirmation ?? fundingData.edit_requires_resign), fundingData.id)
  }, [fundingData])

  // A new signature is owed. Whatever the signing step still holds is the old
  // one - typed or prefilled before the edit - and re-signing has to be a fresh
  // act, so the name and every consent start empty.
  useEffect(() => {
    if (!fundingData?.requires_resign) return

    setAttestation({
      certify: false,
      signature_name: '',
      signature_type: 'typed',
      signature_image: '',
      esign_consent: false,
      terms_consent: false,
      privacy_consent: false,
      credit_consent: false,
      legal_binding_consent: false,
    })
  }, [fundingData?.requires_resign])

  // Until the application has loaded, the flag above is only a default. Saves
  // wait on this, so one fired early still gets the dialog.
  useEffect(() => {
    setEditConfirmationResolving(isFundingDataLoading)
  }, [isFundingDataLoading])

  useEffect(() => () => resetEditConfirmation(), [])

  const initializedRef = React.useRef(false)
  useEffect(() => {
    if (fundingData && !loading && !initializedRef.current) {
      const firstInvalid = tabs.findIndex((_, index) => !isStepValid(index))
      const initialHighest = firstInvalid === -1 ? tabs.length - 1 : firstInvalid
      setHighestVisitedStep(initialHighest)
      // We removed setActiveStep(initialHighest) so it always starts at step 1 for the user to review
      initializedRef.current = true
    }
  }, [fundingData, loading, isStepValid])

  useEffect(() => {
    setHighestVisitedStep(prev => Math.max(prev, activeStep))
  }, [activeStep])

  // The server no longer accepts changes (e.g. Matched to Lender, Closed): the
  // wizard opens read-only and says why, rather than letting the borrower type
  // and only refusing on submit (BUG-071).
  const isLocked = fundingData?.is_editable === false
  const lockedReason = fundingData?.locked_reason || 'This application can no longer be changed.'

  // Check if a step is complete (for progress display)
  const isStepComplete = useCallback(
    (stepIndex: number): boolean =>
      isWizardStepComplete(stepIndex, { fundingData, activeStep, highestVisitedStep, isStepValid }),
    [activeStep, highestVisitedStep, isStepValid, fundingData]
  )

  // Progress calculations
  const stepsTotal = tabs.length
  const completedCount = tabs.reduce((acc, _, index) => acc + (isStepComplete(index) ? 1 : 0), 0)
  const progressPct = Math.round((completedCount / stepsTotal) * 100)
  // How far down the list a step may be opened: up to the first one that is not
  // complete (saved - the one without a tick), and never past it. This used to
  // ask only whether a step's fields looked valid, so a step whose form was
  // prefilled but never saved unlocked the one after it, which then showed dark
  // and clickable beside steps that were correctly greyed out.
  const firstIncompleteIdx = tabs.findIndex((_, index) => !isStepComplete(index))
  // Open steps are the complete ones (ticked) and the one being worked on.
  // Every other step is greyed out - including the very next one - until the
  // step before it has been saved. The way forward is Save & Next.
  const lastCompleteIdx = firstIncompleteIdx === -1 ? stepsTotal - 1 : firstIncompleteIdx - 1
  const maxAllowedIdx = Math.max(activeStep, lastCompleteIdx)

  // Handle tab switching with auto-save
  const handleTabSwitch = useCallback(
    async (targetIndex: number) => {
      if (targetIndex === activeStep) return
      if (targetIndex > maxAllowedIdx) return


      // If navigating backwards, or the application is locked (read-only, so
      // nothing to save and the server would refuse it), do not save
      if (targetIndex < activeStep || isLocked) {
        setActiveStep(targetIndex)
        return
      }

      // If navigating forward, use the active step's save function to save and validate
      if (activeStepSaveRef.current) {
        setIsNavigatingSave(true)
        const success = await activeStepSaveRef.current()
        setIsNavigatingSave(false)
        if (success) {
          setActiveStep(targetIndex)
        }
        return
      }

      // Fallback
      setActiveStep(targetIndex)
    },
    [activeStep, maxAllowedIdx, isLocked]
  )

  // Handle mobile accordion click
  const handleMobileTabClick = useCallback(
    (targetIndex: number) => {
      if (targetIndex > maxAllowedIdx) return

      // Toggle accordion if clicking the same tab
      if (mobileOpenIdx === targetIndex) {
        setMobileOpenIdx(null)
        return
      }

      // Switch to the new tab
      handleTabSwitch(targetIndex)
    },
    [mobileOpenIdx, maxAllowedIdx, handleTabSwitch]
  )

  // Common props for step components
  const commonStepProps = useMemo(
    () => ({
      loading,
      onNext: () => setActiveStep(activeStep + 1),
      onBack: () => handleTabSwitch(activeStep - 1),
      onRegisterSave: registerSave,
    }),
    [loading, activeStep, handleTabSwitch, registerSave]
  )

  // Render the current step content
  const renderStep = (stepIndex: number, isActive: boolean): React.ReactNode => {
    const currentCommonProps = {
      ...commonStepProps,
      onRegisterSave: isActive ? registerSave : undefined,
    }

    switch (stepIndex) {
      case STEP_INDICES.BUSINESS_INFO:
        return (
          <BusinessInformationStep
            personal={personal}
            setPersonal={setPersonal}
            business={business}
            setBusiness={setBusiness}
            canProceed={canProceedFromBusinessInfo}
            onNext={() => setActiveStep(STEP_INDICES.OWNERSHIP_INFO)}
            loading={loading}
            onRegisterSave={isActive ? registerSave : undefined}
            fundingSequenceId={fundingSequenceId}
            fundingRequestId={fundingRequestId || id}
          />
        )

      case STEP_INDICES.OWNERSHIP_INFO:
        return (
          <OwnershipInformationStep
            owner={owner}
            setOwner={setOwner}
            coBorrowers={coBorrowers}
            setCoBorrowers={setCoBorrowers}
            onDeleteCoBorrower={deleteCoBorrower}
            onShowCoModal={addCoBorrower}
            coDraft={coDraft}
            setCoDraft={setCoDraft}
            onAddCoBorrower={submitCoBorrower}
            onEditCoBorrower={editCoBorrower}
            isValid={isStepValid(STEP_INDICES.OWNERSHIP_INFO)}
            fundingSequenceId={fundingSequenceId}
            fundingRequestId={fundingRequestId || id}
            {...currentCommonProps}
          />
        )

      case STEP_INDICES.FINANCIAL_INFO:
        return (
          <FinancialInformationStep
            financial={financial}
            setFinancial={setFinancial}
            fundingSequenceId={fundingSequenceId}
            fundingRequestId={fundingRequestId || id}
            {...currentCommonProps}
          />
        )

      case STEP_INDICES.FUNDING_REQUEST:
        return (
          <FundingRequestStep
            funding={funding}
            setFunding={setFunding}
            fundingSequenceId={fundingSequenceId}
            fundingRequestId={fundingRequestId || id}
            {...currentCommonProps}
          />
        )

      case STEP_INDICES.DOCUMENT_UPLOAD:
        return (
          <DocumentUploadStep
            fundingSequenceId={fundingSequenceId}
            fundingRequestId={fundingRequestId || id}
            fundingApplicationId={fundingApplicationId}
            {...currentCommonProps}
          />
        )

      case STEP_INDICES.DISCLOSURES:
        return (
          <DisclosuresStep
            disclosure={disclosure}
            setDisclosure={setDisclosure}
            disclosureItems={disclosureItems}
            fundingRequestId={fundingRequestId || id}
            {...commonStepProps}
          />
        )

      case STEP_INDICES.FEDERAL_COMPLIANCE:
        return (
          <FederalComplianceStep
            federal={federal}
            setFederal={setFederal}
            isValid={isStepValid(STEP_INDICES.FEDERAL_COMPLIANCE)}
            fundingRequestId={fundingRequestId || id}
            {...commonStepProps}
          />
        )

      case STEP_INDICES.ATTESTATION:
        return (
          <AttestationStep
            attestation={attestation}
            setAttestation={setAttestation}
            fundingRequestId={fundingRequestId || id}
            onBack={() => setActiveStep(STEP_INDICES.FEDERAL_COMPLIANCE)}
            onSubmit={() => toast.success('Application submitted!')}
            loading={loading}
            isResigning={Boolean(fundingData?.requires_resign)}
          />
        )

      default:
        return null
    }
  }

  // Render step badge (number or checkmark)
  const renderStepBadge = (stepIndex: number, isCompleted: boolean) => (
    <span className={`sidebar-step-badge ${isCompleted ? 'completed' : ''}`}>
      {isCompleted ? <i className="ri-check-line"></i> : stepIndex + 1}
    </span>
  )

  // Render progress header
  const renderProgressHeader = (className?: string) => (
    <div className={className}>
      <div className="d-flex align-items-center">
        <i className="ri-checkbox-circle-line text-success me-2"></i>
        <span className="fw-semibold fs-15">Application Progress</span>
        <span className="ms-auto progress-badge">{progressPct}%</span>
      </div>
      <div className="small text-muted">
        Completed {completedCount} of {stepsTotal} steps
      </div>
      <progress className="progress-micro" value={completedCount} max={stepsTotal}></progress>
    </div>
  )

  // Same card as Funding Requests > a request that is not found.
  if (isForeignRequest) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <i className="ri-file-unknow-line fs-1 text-muted d-block mb-3" />
              <h6 className="fw-semibold text-dark mb-1">Request not found</h6>
              <button onClick={() => navigate('/funding-requests')} className="btn btn-dark btn-sm mt-3">
                Back to Funding Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Opened on an application whose status isn't editable any more (e.g. the
  // URL was typed or bookmarked): say why instead of a form the API would
  // refuse to save (423).
  if (fundingData?.is_locked) {
    return (
      <div className="page-content fundapplication-page">
        <div className="container-fluid min-vh-70 pt-4">
          <div className="card mx-auto" style={{ maxWidth: 640 }}>
            <div className="card-body text-center p-4">
              <i className="ri-lock-line fs-36 text-warning"></i>
              <h4 className="mt-2 mb-2">Can't Edit Funding Application</h4>
              <p className="text-muted mb-4">
                {fundingData.locked_reason
                  || `This application can no longer be edited because it is "${fundingData.status}". Contact your funding advisor if something needs to change.`}
              </p>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                &larr; Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content fundapplication-page">
      <div className="container-fluid min-vh-70 pt-4">
        {/* Page Header */}
        <div className="text-center mb-4">
          <h4 className="mb-1">
            {completedCount > 0 ? 'Complete' : 'Start'} Your Business Funding Application
            {funding.approvedFunding && ` (${funding.approvedFunding.replace(/\s+Application$/i, '')})`}
          </h4>
          <div className="text-muted">
            {funding.approvedFunding
              ? (completedCount > 0
                  ? 'Please complete the final steps below to process your approved funding request and finalize your funds.'
                  : 'Please complete the steps below to start processing your approved funding sequence and finalize your funds.')
              : (completedCount > 0
                  ? 'Please complete the remaining steps below to finalize your business funding application.'
                  : 'Apply now to unlock working capital, equipment financing, SBA loans, or credit-building options tailored to your goals.')}
          </div>
        </div>

        {fundingData?.edit_requires_resign && (
          <div className="alert alert-warning d-flex align-items-start gap-2 mb-4" role="alert">
            <i className="ri-alert-line fs-18 mt-1"></i>
            <div>
              <strong>This application has already been submitted.</strong> Any change you make to a field will invalidate your existing signature. You will be required to review and re-sign the application, after which it returns to Submitted status for our team to verify.
            </div>
          </div>
        )}

        <div className="row">
          {/* Desktop Sidebar */}
          <div className="col-xl-3 col-lg-4 mb-3 d-none d-lg-block">
            <div className="card">
              <div className="card-body p-0 position-relative">
                {renderProgressHeader('px-2 py-2 border-bottom')}

                <ul className="side-tabs list-unstyled m-0">
                  {tabs.map((label, idx) => {
                    const isCompleted = isStepComplete(idx)
                    const isActive = activeStep === idx
                    const isDisabled = idx > maxAllowedIdx || isNavigatingSave

                    return (
                      <li key={label} className="sidebar-li">
                        <button
                          type="button"
                          className={`side-tab d-flex align-items-center w-100 text-start py-2 px-3 sidebar-step-btn ${isActive ? 'active-step' : ''} ${idx > maxAllowedIdx ? 'disabled' : ''}`}
                          disabled={isDisabled}
                          onClick={() => handleTabSwitch(idx)}
                        >
                          {renderStepBadge(idx, isCompleted)}
                          <span className="fw-semibold sidebar-step-label">{label}</span>
                          {isActive && <span className="sidebar-step-notch show"></span>}
                          {isActive && isNavigatingSave && (
                            <span className="ms-auto spinner-border spinner-border-sm text-white"></span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="col-xl-9 col-lg-8 d-none d-lg-block">
            <div className="card">
              <div className="card-header d-flex align-items-center">
                <span className="fw-semibold fs-15">
                  Step {activeStep + 1} of {stepsTotal}: {tabs[activeStep]}
                </span>
              </div>
              <div className="card-body">
                {isLocked && (
                  <div className="alert alert-info d-flex align-items-start gap-2" role="status">
                    <i className="ri-lock-line fs-16"></i>
                    <span>{lockedReason}</span>
                  </div>
                )}
                {tabs.map((_, idx) => (
                  <div key={idx} style={{ display: activeStep === idx ? 'block' : 'none' }}>
                    <fieldset disabled={isLocked} className="border-0 p-0 m-0">
                      {renderStep(idx, activeStep === idx)}
                    </fieldset>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Accordion */}
          <div className="col-12 d-block d-lg-none">
            <div className="card">
              <div className="card-body p-0">
                {renderProgressHeader('px-3 py-2 border-bottom progress-section')}

                <ul className="list-unstyled m-0">
                  {tabs.map((label, idx) => {
                    const isCompleted = isStepComplete(idx)
                    const isActive = activeStep === idx
                    const isDisabled = idx > maxAllowedIdx || isNavigatingSave
                    const isOpen = mobileOpenIdx === idx

                    return (
                      <li key={label} className="border-bottom">
                        <button
                          type="button"
                          className={`w-100 d-flex align-items-center text-start p-3 side-tab sidebar-step-btn ${isActive ? 'active-step' : ''} ${idx > maxAllowedIdx ? 'disabled' : ''}`}
                          disabled={isDisabled}
                          onClick={() => handleMobileTabClick(idx)}
                        >
                          {renderStepBadge(idx, isCompleted)}
                          <span className="align-middle fw-semibold">{label}</span>
                          {isActive && isNavigatingSave && (
                            <span className="ms-2 spinner-border spinner-border-sm text-white"></span>
                          )}
                          <i className={`ri-arrow-${isOpen ? 'up' : 'down'}-s-line ms-auto`}></i>
                        </button>
                        <div className="p-3" style={{ display: isOpen ? 'block' : 'none' }}>
                          {isLocked && (
                            <div className="alert alert-info d-flex align-items-start gap-2" role="status">
                              <i className="ri-lock-line fs-16"></i>
                              <span>{lockedReason}</span>
                            </div>
                          )}
                          <fieldset disabled={isLocked} className="border-0 p-0 m-0">
                            {renderStep(idx, isOpen)}
                          </fieldset>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CoBorrowerModal
        coDraft={coDraft}
        setCoDraft={setCoDraft}
        onSubmit={(e) => {
          submitCoBorrower(e)
          // An added co-borrower always shows in the list (BUG-108).
          setOwner((prev) => ({ ...prev, hasCoBorrower: true }))
        }}
        isEditing={isEditing}
        otherOwnershipTotal={otherOwnershipTotal}
      />
      {/* Rendered once for the whole wizard: every step's save waits on it. */}
      <EditConfirmationModal status={fundingData?.status} awaitingResign={Boolean(fundingData?.requires_resign)} />
    </div>
  )
}
