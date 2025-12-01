export type PreQualificationData = {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  country: string
  country_code: string
  state: string
  city: string
  postal_code: string
  home_address: string
  home_phone: string
  date_of_birth: string
  last_4_ssn: string
  business_name: string
  business_ein: string
  business_phone: string
  business_address: string
  business_city: string
  business_state: string
  business_postal_code: string
  business_email: string
  business_website: string
  business_entity_type: string
  business_industry_type: string
  business_description: string
  business_logo: string | null
  business_registration_number: string
  tax_identification_number: string
  duns_number: string
  state_file_number: string
  business_start_date: string
  currency: string
  years_in_business: number
  monthly_revenue: string
  annual_revenue: string
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
  phoneCountry: string
  phoneNumber: string
  country: string
  city: string
  state: string
  zip: string
  address: string
  homeCountry: string
  homePhone: string
  dob: string
  last4ssn: string
}

export type BusinessDetails = {
  businessName: string
  ein: string
  businessPhoneCountry: string
  businessPhone: string
  businessAddress: string
  city: string
  state: string
  zip: string
  entityType: string
  industryType: string
  website: string
}

export type FinancialSupport = {
  currency: string
  yearsInBusiness: string
  monthlyRevenue: string
  annualRevenue: string
  fundingAmount: string
  fundingUrgency: string
  fundingPurpose: string
  personalCreditScore: string
  businessCreditScore: string
  note: string
  existingDebt: string
  consent: boolean
}
