import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

// Components
import BusinessInformationStep from './components/steps/BusinessInformationStep'
import OwnershipInformationStep from './components/steps/OwnershipInformationStep'
import FinancialInformationStep from './components/steps/FinancialInformationStep'
import FundingRequestStep from './components/steps/FundingRequestStep'
import DocumentUploadStep from './components/steps/DocumentUploadStep'
import DisclosuresStep from './components/steps/DisclosuresStep'
import FederalComplianceStep from './components/steps/FederalComplianceStep'
import AttestationStep from './components/steps/AttestationStep'

// Hooks
import { useCoBorrowers } from './hooks/useCoBorrowers'
import { useDocumentUpload } from './hooks/useDocumentUpload'

// Types & Utils
import {
  docSections,
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

export default function FundApplication() {
  const navigate = useNavigate()
  const [active, setActive] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // Hooks
  const {
    coBorrowers,
    coDraft,
    setCoDraft,
    showCoModal,
    submitCoBorrower,
    deleteCoBorrower,
    emptyCoDraft,
  } = useCoBorrowers()

  const {
    docUploads,
    docUploading,
    docProgress,
    addDocFiles,
    removeDocFile,
    onDocDrop,
    acceptTypes,
  } = useDocumentUpload(docSections)

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
  })
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
    fundingType: '',
    timeframe: '',
    collateral: '',
  })
  const [federal, setFederal] = useState<FederalCompliance>({
    legalBusinessName: '',
    ein: '',
    country: '',
    ofacResult: '',
    patriotActAck: false,
    fcraAuth: false,
    ecoaAck: false,
    bankruptcy: '',
    lawsuit: '',
    federalLoanDefault: '',
    federalDebtDelinquent: '',
    criminalOffense: '',
    paroleProbation: '',
    suspendedDebarred: '',
    judgmentsLiensBusiness: '',
    judgmentsLiensOwner: '',
    explanation: '',
  })
  const [disclosure, setDisclosure] = useState<DisclosureConsent>({
    agreeTerms: false,
    creditCheckConsent: false,
    eSignConsent: false,
    authorizeVerification: false,
    marketingOptIn: false,
  })
  const [attestation, setAttestation] = useState<Attestation>({ certify: false })

  const [mobileOpenIdx, setMobileOpenIdx] = useState<number | null>(0)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  const canProceed = useMemo(() => {
    if (active !== 0) return true
    return (
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
  }, [active, personal, business])

  const isStepValid = (idx: number): boolean => {
    if (idx === 0) return !!canProceed
    if (idx === 1)
      return !!(
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
    if (idx === 2) {
      const baseOk = !!(financial.monthlyRevenue && financial.checkingStartDate && financial.personalCreditScore)
      const debtOk = !financial.existingDebt || !!financial.debtBalance
      return !!(baseOk && debtOk)
    }
    if (idx === 3) return !!(funding.requestedAmount && funding.purpose && funding.fundingType)
    if (idx === 4) return true
    if (idx === 5) return disclosureItems.every((item) => disclosure[item.key])
    if (idx === 6) {
      const keys: (keyof FederalCompliance)[] = [
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
      const anyYes = keys.some((k) => federal[k] === 'yes')
      const allAnswered = keys.every((k) => federal[k] === 'yes' || federal[k] === 'no')
      return !!(allAnswered && (!anyYes || federal.explanation.trim().length > 0))
    }
    if (idx === 7) return !!attestation.certify
    return false
  }

  const isStepComplete = (idx: number): boolean => {
    if (idx === 4) {
      return Object.values(docUploads).some((list) => (list || []).length > 0)
    }
    return isStepValid(idx)
  }

  const stepsTotal = tabs.length
  const completedCount = tabs.reduce((acc, _label, i) => acc + (isStepComplete(i) ? 1 : 0), 0)
  const progressPct = Math.round((completedCount / stepsTotal) * 100)
  const firstInvalidIdx = tabs.findIndex((_, i) => !isStepValid(i))
  const maxAllowedIdx = firstInvalidIdx === -1 ? stepsTotal - 1 : firstInvalidIdx

  useEffect(() => {
    setMobileOpenIdx(active)
  }, [active])

  const renderStep = (idx: number): React.ReactNode => {
    const commonProps = {
      loading,
      onNext: () => setActive(active + 1),
      onBack: () => setActive(active - 1),
    }

    switch (idx) {
      case 0:
        return (
          <BusinessInformationStep
            personal={personal}
            setPersonal={setPersonal}
            business={business}
            setBusiness={setBusiness}
            canProceed={!!canProceed}
            onNext={() => setActive(1)}
            loading={loading}
          />
        )
      case 1:
        return (
          <OwnershipInformationStep
            owner={owner}
            setOwner={setOwner}
            coBorrowers={coBorrowers}
            onDeleteCoBorrower={deleteCoBorrower}
            onShowCoModal={showCoModal}
            coDraft={coDraft}
            setCoDraft={setCoDraft}
            onAddCoBorrower={submitCoBorrower}
            isValid={isStepValid(1)}
            {...commonProps}
          />
        )
      case 2:
        return (
          <FinancialInformationStep
            financial={financial}
            setFinancial={setFinancial}
            {...commonProps}
          />
        )
      case 3:
        return (
          <FundingRequestStep 
            funding={funding} 
            setFunding={setFunding} 
            {...commonProps} 
          />
        )
      case 4:
        return (
          <DocumentUploadStep
            sections={docSections}
            docUploads={docUploads}
            docUploading={docUploading}
            docProgress={docProgress}
            addDocFiles={addDocFiles}
            removeDocFile={removeDocFile}
            onDocDrop={onDocDrop}
            acceptTypes={acceptTypes}
            {...commonProps}
          />
        )
      case 5:
        return (
          <DisclosuresStep
            disclosure={disclosure}
            setDisclosure={setDisclosure}
            disclosureItems={disclosureItems}
            {...commonProps}
          />
        )
      case 6:
        return (
          <FederalComplianceStep
            federal={federal}
            setFederal={setFederal}
            isValid={isStepValid(6)}
            {...commonProps}
          />
        )
      case 7:
        return (
          <AttestationStep
            attestation={attestation}
            setAttestation={setAttestation}
            onBack={() => setActive(6)}
            onSubmit={() => toast.success('Application submitted!')}
            loading={loading}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="page-content fundapplication-page">
      <div className="container-fluid min-vh-70 pt-2">
        <div className="text-center mb-4">
          <h4 className="mb-1">Start Your Business Funding Application</h4>
          <div className="text-muted">Apply now to unlock working capital, equipment financing, SBA loans, or credit-building options tailored to your goals.</div>
        </div>

        <div className="row">
          <div className="col-xl-3 col-lg-4 mb-3 d-none d-lg-block">
            <div className="card">
              <div className="card-body p-0 position-relative">
                <div className="px-2 py-2 border-bottom">
                  <div className="d-flex align-items-center">
                    <i className="ri-checkbox-circle-line text-success me-2"></i>
                    <span className="fw-semibold fs-15">Application Progress</span>
                    <span className="ms-auto progress-badge">{progressPct}%</span>
                  </div>
                  <div className="small text-muted">Completed {completedCount} of {stepsTotal} steps</div>
                  <progress className="progress-micro" value={completedCount} max={stepsTotal}></progress>
                </div>
                <ul className="side-tabs list-unstyled m-0">
                  {tabs.map((label, idx) => {
                    const isCompleted = isStepComplete(idx)
                    const isActive = active===idx
                    return (
                      <li key={label} className="sidebar-li">
                        <button
                          type="button"
                          className={`side-tab d-flex align-items-center w-100 text-start py-2 px-3 sidebar-step-btn ${isActive?'active-step':''} ${idx>maxAllowedIdx ? 'disabled' : ''}`}
                          disabled={idx>maxAllowedIdx}
                          onClick={() => { if (idx<=maxAllowedIdx) setActive(idx) }}
                        >
                          <span className={`sidebar-step-badge ${isCompleted?'completed':''}`}>{isCompleted ? <i className="ri-check-line"></i> : (idx+1)}</span>
                          <span className="fw-semibold sidebar-step-label">{label}</span>
                          <span className={`sidebar-step-notch ${isActive?'show':''}`}></span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>

          <div className="col-xl-9 col-lg-8 d-none d-lg-block">
            <div className="card">
              <div className="card-header d-flex align-items-center">
                <span className="fw-semibold fs-15">Step {active+1} of {stepsTotal}: {tabs[active]}</span>
                <span className="ms-auto badge bg-primary">{progressPct}%</span>
              </div>
              <div className="card-body">
                {renderStep(active)}

              </div>
            </div>
          </div>
          <div className="col-12 d-block d-lg-none">
            <div className="card">
              <div className="card-body p-0">
                <div className="px-3 py-2 border-bottom progress-section">
                  <div className="d-flex align-items-center">
                    <i className="ri-checkbox-circle-line text-success me-2"></i>
                    <span className="fw-semibold progress-title">Application Progress</span>
                    <span className="ms-auto progress-badge">{progressPct}%</span>
                  </div>
                  <div className="progress-subtitle text-muted">Completed {completedCount} of {stepsTotal} steps</div>
                  <progress className="progress-micro" value={completedCount} max={stepsTotal}></progress>
                </div>
                <ul className="list-unstyled m-0">
                  {tabs.map((label, idx) => {
                    const isCompleted = isStepComplete(idx)
                    const isActive = active===idx
                    return (
                      <li key={label} className="border-bottom">
                        <button
                          type="button"
                          className={`w-100 d-flex align-items-center text-start p-3 side-tab sidebar-step-btn ${isActive?'active-step':''} ${idx>maxAllowedIdx ? 'disabled' : ''}`}
                          disabled={idx>maxAllowedIdx}
                          onClick={() => {
                            if (idx>maxAllowedIdx) return
                            if (mobileOpenIdx === idx) {
                              setMobileOpenIdx(null)
                              return
                            }
                            setActive(idx)
                            setMobileOpenIdx(idx)
                          }}
                        >
                          <span className={`sidebar-step-badge ${isCompleted?'completed':''}`}>{isCompleted ? <i className="ri-check-line"></i> : (idx+1)}</span>
                          <span className="align-middle fw-semibold">{label}</span>
                          <i className={`ri-arrow-${mobileOpenIdx===idx?'up':'down'}-s-line ms-auto`}></i>
                        </button>
                        {mobileOpenIdx === idx && (
                          <div className="p-3">
                            {renderStep(idx)}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
