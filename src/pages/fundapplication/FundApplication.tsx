import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

type PersonalInfo = {
  firstName: string
  lastName: string
  email: string
  phoneCountry: string
  phoneNumber: string
}

type BusinessDetails = {
  businessName: string
  businessAddress: string
  city: string
  state: string
  incorporationState: string
  zip: string
  industryType: string
  entityType: string
  timeInBusiness: string
  employees: string
}

type OwnerInfo = {
  firstName: string
  lastName: string
  dob: string
  ssn: string
  citizenship: string
  streetAddress: string
  city: string
  state: string
  zip: string
  ownershipPct: string
  hasCoBorrower: boolean
}

type CoBorrower = {
  firstName: string
  lastName: string
  role: string
  ownershipPct: string
  email: string
  mobilePhone: string
  homePhone: string
  streetAddress: string
  city: string
  state: string
  zip: string
  ssn: string
  dob: string
  driversLicenseNumber: string
  driversLicenseState: string
}

type FinancialInfo = {
  monthlyRevenue: string
  annualRevenue: string
  bankName: string
  checkingStartDate: string
  personalCreditScore: string
  businessCreditScore: string
  existingDebt: boolean
  debtBalance: string
}

type FundingRequest = {
  requestedAmount: string
  purpose: string
  fundingType: string
  timeframe: string
  collateral: string
}

type FileEntry = { name: string; size: number; type: string; file: File }
type FederalCompliance = {
  legalBusinessName: string
  ein: string
  country: string
  ofacResult: string
  patriotActAck: boolean
  fcraAuth: boolean
  ecoaAck: boolean
  bankruptcy: string
  lawsuit: string
  federalLoanDefault: string
  federalDebtDelinquent: string
  criminalOffense: string
  paroleProbation: string
  suspendedDebarred: string
  judgmentsLiensBusiness: string
  judgmentsLiensOwner: string
  explanation: string
}
type Attestation = { certify: boolean }

const docSections = [
  "Driver's License",
  'Voided Business Check',
  'EIN / Corporation Docs',
  'Business Bank Statements',
  'Equipment Invoice / Quote',
  'A/R Aging Reposrt',
  'Business Plan',
  'Business Tax Returns',
  'Personal Tax Returns',
  'Miscellaneous Documents',
]

const tabs = [
  'Business Information',
  'Ownership Information',
  'Financial Information',
  'Funding Request',
  'Document Upload',
  'Disclosures and consent',
  'Federal Compliance Disclosures',
  'Attestation and authorization',
]

export default function FundApplication() {
  const navigate = useNavigate()
  const [active, setActive] = useState<number>(0)
  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
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
    timeInBusiness: '',
    employees: '',
  })
  const [owner, setOwner] = useState<OwnerInfo>({
    firstName: '',
    lastName: '',
    dob: '',
    ssn: '',
    citizenship: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    ownershipPct: '',
    hasCoBorrower: false,
  })
  const emptyCoDraft: CoBorrower = {
    firstName: '',
    lastName: '',
    role: '',
    ownershipPct: '',
    email: '',
    mobilePhone: '',
    homePhone: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    ssn: '',
    dob: '',
    driversLicenseNumber: '',
    driversLicenseState: '',
  }
  const [coBorrowers, setCoBorrowers] = useState<CoBorrower[]>([])
  const [coDraft, setCoDraft] = useState<CoBorrower>(emptyCoDraft)
  const showCoModal = () => {
    const el = typeof document !== 'undefined' ? document.getElementById('coBorrowerModal') : null
    const bs = (window as any)?.bootstrap
    if (el && bs?.Modal) bs.Modal.getOrCreateInstance(el).show()
  }
  const hideCoModal = () => {
    const el = typeof document !== 'undefined' ? document.getElementById('coBorrowerModal') : null
    const bs = (window as any)?.bootstrap
    if (el && bs?.Modal) bs.Modal.getInstance(el)?.hide()
  }
  const submitCoBorrower = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCoBorrowers((prev) => [...prev, coDraft])
    setCoDraft(emptyCoDraft)
    hideCoModal()
    toast.success('Co-borrower added')
  }
  const deleteCoBorrower = (idx: number) => {
    setCoBorrowers(coBorrowers.filter((_, i) => i !== idx))
  }
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
  const disclosureItems: { key: keyof DisclosureConsent; label: string; route: string }[] = [
    { key: 'agreeTerms', label: 'Credit Pull Authorization', route: '/disclosures/terms' },
    { key: 'creditCheckConsent', label: 'Terms & Conditions Acceptance', route: '/disclosures/credit-check' },
  ]
  const toggleDisclosure = (key: keyof DisclosureConsent, checked: boolean) => {
    setDisclosure({ ...disclosure, [key]: checked })
  }
  const [docUploads, setDocUploads] = useState<Record<string, FileEntry[]>>(() => {
    const init: Record<string, FileEntry[]> = {}
    docSections.forEach((s) => (init[s] = []))
    return init
  })
  const [docUploading, setDocUploading] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    docSections.forEach((s) => (init[s] = false))
    return init
  })
  const [docProgress, setDocProgress] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    docSections.forEach((s) => (init[s] = 0))
    return init
  })
  const acceptTypes = 'image/*,.pdf,.doc,.docx,.xls,.xlsx'
  const maxSize = 10 * 1024 * 1024
  const [attestation, setAttestation] = useState<Attestation>({ certify: false })
  const addDocFiles = (key: string, list: FileList | File[]) => {
    const arr = Array.from(list as FileList)
    const invalid = arr.filter((f) => !(f.type.startsWith('image/') || ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(f.type)) || f.size > maxSize)
    if (invalid.length) {
      toast.error('Unsupported file or size exceeds 10MB')
      return
    }
    setDocUploading((prev) => ({ ...prev, [key]: true }))
    setDocProgress((prev) => ({ ...prev, [key]: 0 }))
    setDocUploads((prev) => {
      const next = { ...prev }
      const mapped = arr.map<FileEntry>((f) => ({ name: f.name, size: f.size, type: f.type, file: f }))
      next[key] = [...(next[key] || []), ...mapped]
      return next
    })
    let pct = 0
    const step = 7 + Math.round(Math.random() * 12)
    const timer = setInterval(() => {
      pct = Math.min(100, pct + step)
      setDocProgress((p) => ({ ...p, [key]: pct }))
      if (pct >= 100) {
        clearInterval(timer)
        setDocUploading((u) => ({ ...u, [key]: false }))
      }
    }, 120)
  }
  const removeDocFile = (key: string, name: string) => {
    setDocUploads((prev) => {
      const next = { ...prev }
      next[key] = (next[key] || []).filter((f) => f.name !== name)
      return next
    })
  }
  const onDocDrop = (e: React.DragEvent<HTMLDivElement>, key: string) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length) addDocFiles(key, e.dataTransfer.files)
  }
  const fmtDocSize = (n: number) => {
    if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
    if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${n} B`
  }
  const docIconFor = (t: string) => {
    if (t.startsWith('image/')) return 'ri-file-image-line'
    if (t === 'application/pdf') return 'ri-file-pdf-line'
    if (t === 'application/msword' || t === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'ri-file-word-line'
    if (t === 'application/vnd.ms-excel' || t === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'ri-file-excel-line'
    return 'ri-file-line'
  }

  const [mobileOpenIdx, setMobileOpenIdx] = useState<number | null>(0)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  const canProceed = useMemo(() => {
    if (active !== 0) return true
    return (
      personal.firstName &&
      personal.lastName &&
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
      business.timeInBusiness
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
      const baseOk = !!(
        financial.monthlyRevenue &&
        financial.checkingStartDate &&
        financial.personalCreditScore
      )
      const debtOk = !financial.existingDebt || !!financial.debtBalance
      return !!(baseOk && debtOk)
    }
    if (idx === 3)
      return !!(
        funding.requestedAmount &&
        funding.purpose &&
        funding.fundingType
      )
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
    if (idx === 0) {
      return loading ? (
        <form className="row g-3">
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 80, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 80, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 60, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 100, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 120, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 180, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 40, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 60, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 160, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 80, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 120, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 140, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 80, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-12 d-flex justify-content-end mt-4">
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
          </div>
        </form>
      ) : (
        <form className="row g-3">
          <div className="col-md-6">
            <label className="form-label">First Name <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Enter first name" value={personal.firstName} onChange={(e)=>setPersonal({...personal,firstName:e.target.value})} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Last Name <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Enter last name" value={personal.lastName} onChange={(e)=>setPersonal({...personal,lastName:e.target.value})} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Email <span className="text-danger">*</span></label>
            <input type="email" className="form-control" placeholder="Enter email id" value={personal.email} onChange={(e)=>setPersonal({...personal,email:e.target.value})} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Mobile Phone <span className="text-danger">*</span></label>
            <div className="input-group">
              <select className="form-select" value={personal.phoneCountry} onChange={(e)=>setPersonal({...personal,phoneCountry:e.target.value})}>
                <option>USA (+1)</option>
                <option>Canada (+1)</option>
              </select>
              <input type="tel" className="form-control" placeholder="Enter number" value={personal.phoneNumber} onChange={(e)=>setPersonal({...personal,phoneNumber:e.target.value})} />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label">Business Name <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Enter business name" value={business.businessName} onChange={(e)=>setBusiness({...business,businessName:e.target.value})} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Business Street Address <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Enter business street address" value={business.businessAddress} onChange={(e)=>setBusiness({...business,businessAddress:e.target.value})} />
          </div>

          <div className="col-md-6">
            <label className="form-label">City <span className="text-danger">*</span></label>
            <select className="form-select" value={business.city} onChange={(e)=>setBusiness({...business,city:e.target.value})}>
              <option value="">Select city</option>
              <option value="New York">New York</option>
              <option value="Los Angeles">Los Angeles</option>
              <option value="Chicago">Chicago</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">State <span className="text-danger">*</span></label>
            <select className="form-select" value={business.state} onChange={(e)=>setBusiness({...business,state:e.target.value})}>
              <option value="">Select state</option>
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="IL">Illinois</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">State of Incorporation <span className="text-danger">*</span></label>
            <select className="form-select" value={business.incorporationState} onChange={(e)=>setBusiness({...business,incorporationState:e.target.value})}>
              <option value="">Select state of incorporation</option>
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="IL">Illinois</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Zip Code <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Enter zip code" value={business.zip} onChange={(e)=>setBusiness({...business,zip:e.target.value})} />
          </div>

          <div className="col-md-6">
            <label className="form-label">Industry Type <span className="text-danger">*</span></label>
            <select className="form-select" value={business.industryType} onChange={(e)=>setBusiness({...business,industryType:e.target.value})}>
              <option value="">Select industry type</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Services">Services</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Entity Type <span className="text-danger">*</span></label>
            <select className="form-select" value={business.entityType} onChange={(e)=>setBusiness({...business,entityType:e.target.value})}>
              <option value="">Select entity type</option>
              <option value="LLC">LLC</option>
              <option value="Corporation">Corporation</option>
              <option value="Sole Proprietorship">Sole Proprietorship</option>
              <option value="Partnership">Partnership</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Time in Business <span className="text-danger">*</span></label>
            <select className="form-select" value={business.timeInBusiness} onChange={(e)=>setBusiness({...business,timeInBusiness:e.target.value})}>
              <option value="">Select time in business</option>
              <option value="1">1 year</option>
              <option value="2">2 years</option>
              <option value="3">3 years</option>
              <option value="5">5+ years</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Number of Employees</label>
            <input type="text" className="form-control" placeholder="Enter number of employees" value={business.employees} onChange={(e)=>setBusiness({...business,employees:e.target.value})} />
          </div>

          <div className="col-12 d-flex justify-content-end mt-4">
            <button type="button" className="btn btn-primary" disabled={!canProceed} onClick={()=>setActive(1)}>
              Next <i className="ri-arrow-right-line ms-1"></i>
            </button>
          </div>
        </form>
      )
    }
    if (idx === 1) {
      return loading ? (
        <form className="row g-3">
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 80, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 80, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 120, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 180, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 140, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 120, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 100, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 40, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 80, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 60, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-12 d-flex align-items-center">
            <div className="skeleton-line" style={{ height: 20, width: 140, marginBottom: 0 }}></div>
          </div>
          <div className="col-12 d-flex justify-content-between mt-2">
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
          </div>
        </form>
      ) : (
        <form className="row g-3">
          <div className="col-md-6">
            <label className="form-label">First Name <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Enter first name" value={owner.firstName} onChange={(e)=>setOwner({...owner,firstName:e.target.value})} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Last Name <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Enter last name" value={owner.lastName} onChange={(e)=>setOwner({...owner,lastName:e.target.value})} />
          </div>

          <div className="col-md-6">
            <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
            <input type="date" className="form-control" value={owner.dob} onChange={(e)=>setOwner({...owner,dob:e.target.value})} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Social Security Number (SSN) <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Enter social security number (SSN)" value={owner.ssn} onChange={(e)=>setOwner({...owner,ssn:e.target.value})} />
          </div>

          <div className="col-md-6">
            <label className="form-label">Citizenship Status <span className="text-danger">*</span></label>
            <select className="form-select" value={owner.citizenship} onChange={(e)=>setOwner({...owner,citizenship:e.target.value})}>
              <option value="">Select citizenship status</option>
              <option value="US Citizen">US Citizen</option>
              <option value="Permanent Resident">Permanent Resident</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Street Address <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Enter street address" value={owner.streetAddress} onChange={(e)=>setOwner({...owner,streetAddress:e.target.value})} />
          </div>

          <div className="col-md-6">
            <label className="form-label">City <span className="text-danger">*</span></label>
            <select className="form-select" value={owner.city} onChange={(e)=>setOwner({...owner,city:e.target.value})}>
              <option value="">Select city</option>
              <option value="New York">New York</option>
              <option value="Los Angeles">Los Angeles</option>
              <option value="Chicago">Chicago</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">State <span className="text-danger">*</span></label>
            <select className="form-select" value={owner.state} onChange={(e)=>setOwner({...owner,state:e.target.value})}>
              <option value="">Select state</option>
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="IL">Illinois</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Zip Code <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Enter zip code" value={owner.zip} onChange={(e)=>setOwner({...owner,zip:e.target.value})} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Ownership % <span className="text-danger">*</span></label>
            <input type="number" className="form-control" placeholder="Enter ownership %" value={owner.ownershipPct} onChange={(e)=>setOwner({...owner,ownershipPct:e.target.value})} />
          </div>

          <div className="col-12 d-flex align-items-center">
            <div className="form-check">
              <input id="hasCoBorrower" className="form-check-input" type="checkbox" checked={owner.hasCoBorrower} onChange={(e)=>{ setOwner({...owner,hasCoBorrower:e.target.checked}); if(e.target.checked) showCoModal() }} />
              <label htmlFor="hasCoBorrower" className="form-check-label">Has Co-Borrower?</label>
            </div>
          </div>

          {(owner.hasCoBorrower || coBorrowers.length > 0) && (
            <div className="col-12 mt-2">
              <div className="card coborrower-card">
                <div className="card-header d-flex align-items-center">
                  <span className="card-title fw-semibold">Co-Borrowers</span>
                  {coBorrowers.length > 0 && (
                    <button type="button" className="btn btn-primary ms-auto btn-add-coborrower" data-bs-toggle="modal" data-bs-target="#coBorrowerModal">+ ADD</button>
                  )}
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table coborrower-table">
                      <thead className="coborrower-thead">
                        <tr>
                          <th>First Name</th>
                          <th>Last Name</th>
                          <th>Ownership</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coBorrowers.map((cb, idx) => (
                          <tr key={`${cb.firstName}-${cb.lastName}-${idx}`} className="coborrower-row">
                            <td data-label="First Name">{cb.firstName}</td>
                            <td data-label="Last Name">{cb.lastName}</td>
                            <td data-label="Ownership">{cb.ownershipPct ? `${cb.ownershipPct}%` : ''}</td>
                            <td data-label="Action" className="text-end">
                              <button type="button" className="btn btn-link text-danger p-0" onClick={()=>deleteCoBorrower(idx)} aria-label="Delete"><i className="ri-delete-bin-line"></i></button>
                            </td>
                          </tr>
                        ))}
                        {coBorrowers.length===0 && (
                          <tr><td colSpan={4} className="text-center text-muted">No co-borrowers added</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}


          <div className="col-12 d-flex justify-content-between mt-2">
            <button type="button" className="btn btn-warning" onClick={()=>setActive(0)}>
              <i className="ri-arrow-left-line me-1"></i> Previous
            </button>
            <button type="button" className="btn btn-primary" disabled={!isStepValid(1)} onClick={()=>setActive(2)}>
              Next <i className="ri-arrow-right-line ms-1"></i>
            </button>
          </div>
        </form>
      )
    }
    if (idx === 2) {
      return loading ? (
        <form className="row g-3">
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 120, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 120, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 140, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 180, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 200, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 180, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6 d-flex align-items-center">
            <div className="skeleton-line" style={{ height: 16, width: 160, marginBottom: 0 }}></div>
            <div className="skeleton-line" style={{ height: 20, width: 40, marginLeft: 16, marginBottom: 0 }}></div>
            <div className="skeleton-line" style={{ height: 20, width: 40, marginLeft: 16, marginBottom: 0 }}></div>
          </div>
          <div className="col-12 d-flex justify-content-between mt-2">
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
          </div>
        </form>
      ) : (
        <form className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Monthly Revenue <span className="text-danger">*</span></label>
            <input type="number" className="form-control" placeholder="Enter monthly revenue" value={financial.monthlyRevenue} onChange={(e)=>setFinancial({...financial,monthlyRevenue:e.target.value})} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Annual Revenue</label>
            <input type="number" className="form-control" placeholder="Enter annual revenue" value={financial.annualRevenue} onChange={(e)=>setFinancial({...financial,annualRevenue:e.target.value})} />
          </div>

          <div className="col-md-6">
            <label className="form-label">Business Bank Name</label>
            <input type="text" className="form-control" placeholder="Enter business bank name" value={financial.bankName} onChange={(e)=>setFinancial({...financial,bankName:e.target.value})} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Business Checking Start Date <span className="text-danger">*</span></label>
            <input type="date" className="form-control" value={financial.checkingStartDate} onChange={(e)=>setFinancial({...financial,checkingStartDate:e.target.value})} />
          </div>

          <div className="col-md-6">
            <label className="form-label">Self-Reported Personal Credit Score <span className="text-danger">*</span></label>
            <select className="form-select" value={financial.personalCreditScore} onChange={(e)=>setFinancial({...financial,personalCreditScore:e.target.value})}>
              <option value="">Select self-reported personal credit score</option>
              <option value="Below 600">Below 600</option>
              <option value="600-649">600-649</option>
              <option value="650-699">650-699</option>
              <option value="700-749">700-749</option>
              <option value="750+">750+</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Self-Reported Business Credit Score</label>
            <select className="form-select" value={financial.businessCreditScore} onChange={(e)=>setFinancial({...financial,businessCreditScore:e.target.value})}>
              <option value="">Select self-reported business credit score</option>
              <option value="Below 600">Below 600</option>
              <option value="600-649">600-649</option>
              <option value="650-699">650-699</option>
              <option value="700-749">700-749</option>
              <option value="750+">750+</option>
            </select>
          </div>

          <div className="col-md-6 d-flex align-items-center">
            <label className="form-label me-3 mb-0">Existing Business Debt?</label>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="existingDebt" id="existingDebtYes" checked={financial.existingDebt === true} onChange={()=>setFinancial({...financial,existingDebt:true})} />
              <label className="form-check-label" htmlFor="existingDebtYes">Yes</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="existingDebt" id="existingDebtNo" checked={financial.existingDebt === false} onChange={()=>setFinancial({...financial,existingDebt:false,debtBalance:''})} />
              <label className="form-check-label" htmlFor="existingDebtNo">No</label>
            </div>
          </div>

          {financial.existingDebt && (
            <div className="col-12">
              <label className="form-label">Debt Balance (if yes)</label>
              <input type="number" className="form-control" placeholder="Enter Debt Balance" value={financial.debtBalance} onChange={(e)=>setFinancial({...financial,debtBalance:e.target.value})} />
            </div>
          )}

          <div className="col-12 d-flex justify-content-between mt-2">
            <button type="button" className="btn btn-warning" onClick={()=>setActive(1)}>
              <i className="ri-arrow-left-line me-1"></i> Previous
            </button>
            <button type="button" className="btn btn-primary" disabled={!isStepValid(2)} onClick={()=>setActive(3)}>
              Next <i className="ri-arrow-right-line ms-1"></i>
            </button>
          </div>
        </form>
      )
    }
    if (idx === 3) {
      return loading ? (
        <form className="row g-3">
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 140, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 140, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 160, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 120, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-md-6">
            <div className="skeleton-line" style={{ height: 16, width: 140, marginBottom: 8 }}></div>
            <div className="skeleton-line" style={{ height: 38, borderRadius: 6 }}></div>
          </div>
          <div className="col-12 d-flex justify-content-between mt-2">
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
          </div>
        </form>
      ) : (
        <form className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Requested Amount <span className="text-danger">*</span></label>
            <input type="number" className="form-control" placeholder="Enter requested amount" value={funding.requestedAmount} onChange={(e)=>setFunding({...funding,requestedAmount:e.target.value})} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Purpose of Funds <span className="text-danger">*</span></label>
            <select className="form-select" value={funding.purpose} onChange={(e)=>setFunding({...funding,purpose:e.target.value})}>
              <option value="">Select purpose of funds</option>
              <option value="Working Capital">Working Capital</option>
              <option value="Equipment Purchase">Equipment Purchase</option>
              <option value="Inventory">Inventory</option>
              <option value="Marketing">Marketing</option>
              <option value="Expansion">Expansion</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Preferred Funding Type <span className="text-danger">*</span></label>
            <select className="form-select" value={funding.fundingType} onChange={(e)=>setFunding({...funding,fundingType:e.target.value})}>
              <option value="">Select preferred funding type</option>
              <option value="Term Loan">Term Loan</option>
              <option value="Line of Credit">Line of Credit</option>
              <option value="Equipment Financing">Equipment Financing</option>
              <option value="SBA Loan">SBA Loan</option>
              <option value="Merchant Cash Advance">Merchant Cash Advance</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Timeframe Needed</label>
            <select className="form-select" value={funding.timeframe} onChange={(e)=>setFunding({...funding,timeframe:e.target.value})}>
              <option value="">Select timeframe needed</option>
              <option value="Immediately">Immediately</option>
              <option value="1-2 Weeks">1-2 Weeks</option>
              <option value="1 Month">1 Month</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Collateral Available?</label>
            <select className="form-select" value={funding.collateral} onChange={(e)=>setFunding({...funding,collateral:e.target.value})}>
              <option value="">Select collateral</option>
              <option value="None">None</option>
              <option value="Business Assets">Business Assets</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Equipment">Equipment</option>
              <option value="Inventory">Inventory</option>
            </select>
          </div>

          <div className="col-12 d-flex justify-content-between mt-2">
            <button type="button" className="btn btn-warning" onClick={()=>setActive(2)}>
              <i className="ri-arrow-left-line me-1"></i> Previous
            </button>
            <button type="button" className="btn btn-primary" disabled={!isStepValid(3)} onClick={()=>setActive(4)}>
              Next <i className="ri-arrow-right-line ms-1"></i>
            </button>
          </div>
        </form>
      )
    }
    if (idx === 4) {
      return loading ? (
        <div className="row g-3">
          <div className="col-12">
            <div className="accordion" id="fundDocsAccordion">
              {[1, 2, 3, 4, 5].map((item) => (
                <div className="accordion-item" key={item}>
                  <h2 className="accordion-header">
                    <div className="accordion-button collapsed">
                      <div className="skeleton-line" style={{ height: 20, width: 200, marginRight: 10 }}></div>
                    </div>
                  </h2>
                  <div className="accordion-collapse collapse">
                    <div className="accordion-body">
                      <div className="skeleton-line" style={{ height: 100, width: '100%', marginBottom: 16 }}></div>
                      <div className="skeleton-line" style={{ height: 38, width: 120, borderRadius: 6 }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-12 d-flex justify-content-between mt-2">
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          <div className="col-12">
            <div className="accordion" id="fundDocsAccordion">
              {docSections.map((sec, sidx) => (
                <div className="accordion-item" key={sec}>
                  <h2 className="accordion-header" id={`fund-heading-${sidx}`}>
                    <button className={`accordion-button ${sidx===0 ? '' : 'collapsed'}`} type="button" data-bs-toggle="collapse" data-bs-target={`#fund-collapse-${sidx}`} aria-expanded={sidx===0 ? 'true' : 'false'} aria-controls={`fund-collapse-${sidx}`}>
                      <span className="status-icon" style={{ marginRight: 10 }}>{(docUploads[sec] || []).length ? <i className="ri-check-fill text-success fs-5 fw-bold"></i> : null}</span>
                      <span>{sec}</span>
                    </button>
                  </h2>
                  <div id={`fund-collapse-${sidx}`} className={`accordion-collapse collapse ${sidx===0 ? 'show' : ''}`} aria-labelledby={`fund-heading-${sidx}`} data-bs-parent="#fundDocsAccordion">
                    <div className="accordion-body">
                      {docUploading[sec] && (
                        <div className="progress mb-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={docProgress[sec] || 0}>
                          <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${docProgress[sec] || 0}%` }}></div>
                        </div>
                      )}
                      <div
                        className="dropzone dz-clickable text-center"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDocDrop(e, sec)}
                        onClick={() => document.getElementById(`fund-file-${sidx}`)?.click()}
                      >
                        <div className="dz-message needsclick">
                          <div className="mb-3">
                            <i className="display-4 text-muted ri-upload-cloud-2-fill"></i>
                          </div>
                          <h4>Drop files here or click to upload.</h4>
                        </div>
                        <input id={`fund-file-${sidx}`} type="file" multiple accept={acceptTypes} className="d-none" onChange={(e) => e.target.files && addDocFiles(sec, e.target.files)} />
                      </div>
                      <div className="mt-3 file-list">
                        {(docUploads[sec] || []).map((f) => (
                          <div className="item d-flex align-items-center justify-content-between py-2" key={f.name}>
                            <div className="d-flex align-items-center">
                              <i className={`${docIconFor(f.type)} fs-5 text-primary me-2`}></i>
                              <div className="d-flex flex-column">
                                <span className="name">{f.name}</span>
                                <span className="meta">{fmtDocSize(f.size)}</span>
                              </div>
                            </div>
                            <button type="button" className="btn btn-sm btn-outline-danger" aria-label="Remove file" onClick={() => removeDocFile(sec, f.name)}>
                              <i className="ri-close-line"></i>
                            </button>
                          </div>
                        ))}
                        {(!docUploads[sec] || docUploads[sec].length === 0) && (
                          <div className="text-muted">No files added yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-12 d-flex justify-content-between mt-2">
            <button type="button" className="btn btn-warning" onClick={()=>setActive(3)}>
              <i className="ri-arrow-left-line me-1"></i> Previous
            </button>
            <button type="button" className="btn btn-primary" onClick={()=>setActive(5)}>
              Next <i className="ri-arrow-right-line ms-1"></i>
            </button>
          </div>
        </div>
      )
    }
    if (idx === 5) {
      const allRequiredChecked = disclosureItems.every((item) => disclosure[item.key])
      return loading ? (
        <form className="row g-3">
          {[1, 2].map((item) => (
            <div className="col-12" key={item}>
              <div className="d-flex align-items-center justify-content-between border rounded p-3">
                <div className="form-check">
                  <div className="skeleton-line" style={{ height: 20, width: 200 }}></div>
                </div>
                <div className="skeleton-line" style={{ height: 32, width: 80, borderRadius: 6 }}></div>
              </div>
            </div>
          ))}
          <div className="col-12 d-flex justify-content-between mt-2">
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
          </div>
        </form>
      ) : (
        <form className="row g-3">
          {disclosureItems.map((item) => (
            <div className="col-12" key={item.key}>
              <div className="d-flex align-items-center justify-content-between border rounded p-3">
                <div className="form-check">
                  <input id={`disc-${item.key}`} className="form-check-input" type="checkbox" checked={disclosure[item.key]} onChange={(e)=>toggleDisclosure(item.key, e.target.checked)} />
                  <label htmlFor={`disc-${item.key}`} className="form-check-label fw-semibold ms-2">{item.label} <span className="text-danger">*</span></label>
                </div>
                <button type="button" className="btn btn-sm btn-outline-primary d-flex align-items-center" onClick={() => window.open(item.route, '_blank')}>
                  <i className="ri-eye-line me-1"></i>
                  View
                </button>
              </div>
            </div>
          ))}

          <div className="col-12 d-flex justify-content-between mt-2 pt-2">
            <button type="button" className="btn btn-warning" onClick={()=>setActive(4)}>
              <i className="ri-arrow-left-line me-1"></i> Previous
            </button>
            <button type="button" className="btn btn-primary" disabled={!allRequiredChecked} onClick={()=>setActive(6)}>
              Next <i className="ri-arrow-right-line ms-1"></i>
            </button>
          </div>
        </form>
      )
    }
    if (idx === 6) {
      const questions: { key: keyof FederalCompliance; label: string }[] = [
        { key: 'bankruptcy', label: 'Have you or any owner ever declared bankruptcy?' },
        { key: 'lawsuit', label: 'Are you or any owner currently involved in a lawsuit?' },
        { key: 'federalLoanDefault', label: 'Have you or any owner ever defaulted on a federal loan (student, SBA, FHA, etc.)?' },
        { key: 'federalDebtDelinquent', label: 'Are you or any owner currently delinquent on any federal debt?' },
        { key: 'criminalOffense', label: 'Have you or any owner been arrested or convicted for any criminal offense other than a minor vehicle violation?' },
        { key: 'paroleProbation', label: 'Are you or any owner on parole or probation?' },
        { key: 'suspendedDebarred', label: 'Is the business or any owner currently suspended, debarred, or otherwise excluded from participation in federal programs?' },
        { key: 'judgmentsLiensBusiness', label: 'Is the business presently subject to any judgments or tax liens?' },
        { key: 'judgmentsLiensOwner', label: 'Is any owner presently subject to any judgments or tax liens?' },
      ]
      const anyYes = questions.some((q) => federal[q.key] === 'yes')
      const allAnswered = questions.every((q) => federal[q.key] === 'yes' || federal[q.key] === 'no')
      const stepValid = allAnswered && (!anyYes || federal.explanation.trim().length > 0)
      return loading ? (
        <form className="row g-3">
          <div className="col-12">
            <div className="list-group">
              {questions.map((q, index) => (
                <div className="list-group-item" key={index}>
                  <div className="row align-items-center">
                    <div className="col-9 text-start">
                      <div className="skeleton-line" style={{ height: 16, width: '80%' }}></div>
                    </div>
                    <div className="col-3 text-end">
                      <div className="skeleton-line" style={{ height: 32, width: 80, borderRadius: 6 }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="skeleton-line" style={{ height: 16, width: 100 }}></div>
              </div>
              <div className="card-body">
                <div className="skeleton-line" style={{ height: 96, borderRadius: 6 }}></div>
              </div>
            </div>
          </div>

          <div className="col-12 d-flex justify-content-between mt-2">
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
            <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
          </div>
        </form>
      ) : (
        <form className="row g-3">
          <div className="col-12">
            <div className="list-group">
              {questions.map((q) => (
                <div className="list-group-item" key={q.key as string}>
                  <div className="row align-items-center">
                    <div className="col-9 text-start">
                      <span className="fw-medium d-block">{q.label} <span className="text-danger">*</span></span>
                    </div>
                    <div className="col-3 text-end">
                      <div className="btn-group" role="group" aria-label={`Select answer for ${q.label}`}>
                        <input type="radio" className="btn-check" name={q.key as string} id={`${q.key}-yes`} checked={federal[q.key]==='yes'} onChange={()=>setFederal({...federal,[q.key]:'yes'})} />
                        <label className="btn btn-sm btn-outline-success" htmlFor={`${q.key}-yes`}>Yes</label>
                        <input type="radio" className="btn-check" name={q.key as string} id={`${q.key}-no`} checked={federal[q.key]==='no'} onChange={()=>setFederal({...federal,[q.key]:'no'})} />
                        <label className="btn btn-sm btn-outline-danger" htmlFor={`${q.key}-no`}>No</label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-12">
            <div className="card">
              <div className="card-header text-start">Explanation <span className="text-danger">{anyYes ? '*' : ''}</span></div>
              <div className="card-body">
                <textarea className="form-control" rows={4} placeholder="If yes to any of the above, explain" value={federal.explanation} onChange={(e)=>setFederal({...federal,explanation:e.target.value})} />
                {anyYes && !federal.explanation.trim() && (
                  <div className="form-text text-danger mt-1">Explanation is required when any answer is Yes.</div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 d-flex justify-content-between mt-2">
            <button type="button" className="btn btn-warning" onClick={()=>setActive(5)}>
              <i className="ri-arrow-left-line me-1"></i> Previous
            </button>
            <button type="button" className="btn btn-primary" disabled={!stepValid} onClick={()=>setActive(7)}>
              Next <i className="ri-arrow-right-line ms-1"></i>
            </button>
          </div>
        </form>
      )
    }
    return loading ? (
      <form className="row g-3">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="skeleton-line" style={{ height: 16, width: '100%', marginBottom: 12 }}></div>
              <div className="skeleton-line" style={{ height: 16, width: '100%', marginBottom: 12 }}></div>
              <div className="skeleton-line" style={{ height: 16, width: '90%' }}></div>
              <div className="form-check mt-3">
                <div className="skeleton-line" style={{ height: 20, width: 80 }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 d-flex justify-content-between mt-2">
          <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
          <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
        </div>
      </form>
    ) : (
      <form className="row g-3">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <p className="mb-3">
                By signing below, I certify that all information provided in this application is true, complete, and
                accurate to the best of my knowledge. I understand that providing false information may be a violation of
                federal law (18 U.S.C. § 1001) and subject to criminal penalties. I authorize Four Corner Holdings, LLC and its
                partners to obtain credit reports, verify the information provided, and share it with funding partners as necessary.
              </p>
              <div className="form-check">
                <input id="attestCertify" className="form-check-input" type="checkbox" checked={attestation.certify} onChange={(e)=>setAttestation({ certify: e.target.checked })} />
                <label htmlFor="attestCertify" className="form-check-label">I agree <span className="text-danger">*</span></label>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 d-flex justify-content-between mt-2">
          <button type="button" className="btn btn-warning" onClick={()=>setActive(6)}>
            <i className="ri-arrow-left-line me-1"></i> Previous
          </button>
          <button type="button" className="btn btn-primary" disabled={!attestation.certify}>Submit</button>
        </div>
      </form>
    )
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

      <div className="modal fade" id="coBorrowerModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Co-Borrower</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={submitCoBorrower}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">First Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" placeholder="Enter Your First Name" value={coDraft.firstName} onChange={(e)=>setCoDraft({...coDraft,firstName:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" placeholder="Enter Your Last Name" value={coDraft.lastName} onChange={(e)=>setCoDraft({...coDraft,lastName:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Title/Role <span className="text-danger">*</span></label>
                    <select className="form-select" value={coDraft.role} onChange={(e)=>setCoDraft({...coDraft,role:e.target.value})} required>
                      <option value="">Select Role</option>
                      <option value="Owner">Owner</option>
                      <option value="Partner">Partner</option>
                      <option value="Guarantor">Guarantor</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ownership % <span className="text-danger">*</span></label>
                    <input type="number" className="form-control" placeholder="Enter Ownership %" value={coDraft.ownershipPct} onChange={(e)=>setCoDraft({...coDraft,ownershipPct:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email <span className="text-danger">*</span></label>
                    <input type="email" className="form-control" placeholder="Enter your Email" value={coDraft.email} onChange={(e)=>setCoDraft({...coDraft,email:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Mobile Phone <span className="text-danger">*</span></label>
                    <input type="tel" className="form-control" placeholder="Enter Mobile Number" value={coDraft.mobilePhone} onChange={(e)=>setCoDraft({...coDraft,mobilePhone:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Home Phone</label>
                    <input type="tel" className="form-control" placeholder="Enter Home Phone Number" value={coDraft.homePhone} onChange={(e)=>setCoDraft({...coDraft,homePhone:e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
                    <input type="date" className="form-control" value={coDraft.dob} onChange={(e)=>setCoDraft({...coDraft,dob:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Social Security Number (SSN) <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" placeholder="Enter Social Security Number (SSN)" value={coDraft.ssn} onChange={(e)=>setCoDraft({...coDraft,ssn:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Street Address <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" placeholder="Enter Home Street Address" value={coDraft.streetAddress} onChange={(e)=>setCoDraft({...coDraft,streetAddress:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">City <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" placeholder="Enter City Name" value={coDraft.city} onChange={(e)=>setCoDraft({...coDraft,city:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">State <span className="text-danger">*</span></label>
                    <select className="form-select" value={coDraft.state} onChange={(e)=>setCoDraft({...coDraft,state:e.target.value})} required>
                      <option value="">Select State</option>
                      <option value="CA">California</option>
                      <option value="NY">New York</option>
                      <option value="IL">Illinois</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Zip Code <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" placeholder="Enter Zip Code" value={coDraft.zip} onChange={(e)=>setCoDraft({...coDraft,zip:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Driver’s License Number</label>
                    <input type="text" className="form-control" placeholder="Enter Driver’s License Number" value={coDraft.driversLicenseNumber} onChange={(e)=>setCoDraft({...coDraft,driversLicenseNumber:e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Driver’s License State</label>
                    <select className="form-select" value={coDraft.driversLicenseState} onChange={(e)=>setCoDraft({...coDraft,driversLicenseState:e.target.value})}>
                      <option value="">Select State</option>
                      <option value="CA">California</option>
                      <option value="NY">New York</option>
                      <option value="IL">Illinois</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">+ Add Co-Borrower</button>
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Close</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

type DisclosureConsent = {
  agreeTerms: boolean
  creditCheckConsent: boolean
  eSignConsent: boolean
  authorizeVerification: boolean
  marketingOptIn: boolean
}
