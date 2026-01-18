export type PersonalInfo = {
  fullName: string
  businessName: string
  email: string
  phoneCountry: string
  phoneNumber: string
}

export type BusinessDetails = {
  businessName: string
  businessAddress: string
  city: string
  state: string
  incorporationState: string
  zip: string
  industryType: string
  entityType: string
  yearsInBusiness: string
  employees: string
}

export type OwnerInfo = {
  firstName: string
  lastName: string
  dob: string
  ssn: string
  citizenship: string
  streetAddress: string
  country: string
  city: string
  state: string
  zip: string
  ownershipPct: string
  hasCoBorrower: boolean
}

export type CoBorrower = {
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

export type FinancialInfo = {
  id?: number | null
  monthlyRevenue: string
  annualRevenue: string
  bankName: string
  checkingStartDate: string
  personalCreditScore: string
  businessCreditScore: string
  existingDebt: boolean
  debtBalance: string
}

export type FundingRequest = {
  requestedAmount: string
  purpose: string
  fundingType: string
  timeframe: string
  collateral: string
}

export type FileEntry = { 
  name: string
  size: number
  type: string
  file: File 
}

export type FederalCompliance = {
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

export type DisclosureConsent = {
  agreeTerms: boolean
  creditCheckConsent: boolean
  eSignConsent: boolean
  authorizeVerification: boolean
  marketingOptIn: boolean
}

export type Attestation = { 
  certify: boolean 
}

export const docSections = [
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

export const tabs = [
  'Business Information',
  'Ownership Information',
  'Financial Information',
  'Funding Request',
  'Document Upload',
  'Disclosures and consent',
  'Federal Compliance Disclosures',
  'Attestation and authorization',
]

export const disclosureItems: { key: keyof DisclosureConsent; label: string; route: string }[] = [
  { key: 'agreeTerms', label: 'Credit Pull Authorization', route: '/disclosures/terms' },
  { key: 'creditCheckConsent', label: 'Terms & Conditions Acceptance', route: '/disclosures/credit-check' },
]
