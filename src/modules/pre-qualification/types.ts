export type PreQualificationData = {
  id: string | null
  first_name: string
  last_name: string
  email: string
  phone_number: string
  business_name: string
  business_website: string
  business_structure: string | null
  industry_type: string
  state_of_incorporation: string
  years_in_business: string
  monthly_revenue: string
  annual_revenue: string
  funding_requested_amount: string | null
  funding_urgency: string | null
  purpose_of_funding: string | null
  purpose_note: string | null
  personal_credit_score: string | null
  estimated_business_credit_score: string | null
  existing_business_debt: boolean
  debt_balance: string | null
  notes: string | null
  country: string | null
  status: string
}

export type PreQualificationResponse = {
  status: boolean
  message: string
  data: PreQualificationData
}

export type PersonalInfo = {
  firstName: string
  lastName: string
  email: string
  countryCode: string
  phoneNumber: string
  businessWebsite: string
  stateOfIncorporation: string
}

export type BusinessDetails = {
  businessName: string
  industryType: string
  businessStructure: string
  yearsInBusiness: string
  annualRevenue: string
  monthlyRevenue: string
}

export type FinancialSupport = {
  fundingRequestedAmount: string
  fundingUrgency: string
  purposeOfFunding: string
  purposeNote: string
  personalCreditScore: string
  estimatedBusinessCreditScore: string
  existingBusinessDebt: boolean
  debtBalance: string
  notes: string
}

export type PersonalInfoRequest = {
  id?: string | null
  first_name: string
  last_name: string
  email: string
  phone_number: string
  business_website?: string
  state_of_incorporation: string
}

export type BusinessInfoRequest = {
  id?: string | null
  business_name: string
  industry_type: string
  business_structure: string
  monthly_revenue: number | null
  annual_revenue: number | null
  years_in_business: string
}

export type FundingInfoRequest = {
  id?: string | null
  funding_requested_amount: number | null
  funding_urgency: string
  purpose_of_funding: string
  purpose_note: string | null
  personal_credit_score: string
  estimated_business_credit_score: string
  existing_business_debt: boolean
  debt_balance: number | null
  notes: string
}

export type StepSubmissionResponse = {
  status: boolean
  message: string
  data: {
    id: string
    first_name: string
    last_name: string
    business_website: string
    email: string
    phone: string
    state_of_incorporation: string
    business_name: string
    industry: string
    business_structure: string
    monthly_revenue: string
    annual_revenue: string
    years_in_business: string
    funding_requested_amount: string
    funding_urgency: string
    purpose_of_funding: string
    purpose_note: string
    personal_credit_score: string
    estimated_business_credit_score: string
    existing_business_debt: boolean
    debt_balance: string
    notes: string
    status: string
  }
}

export type SubmitPreQualificationRequest = {
  id: string
}

export type SubmitPreQualificationResponse = {
  status: boolean
  message: string
  data: Record<string, never>
}
