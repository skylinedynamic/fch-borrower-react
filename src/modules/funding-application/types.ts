export interface BusinessInfoData {
  full_name: string | null
  business_name: string | null
  business_ein: string | null
  business_phone: string | null
  business_address: string | null
  business_email: string | null
  duns_number: string | null
  country: string | null
  country_code: string | null
  business_state: string | null
  business_city: string | null
  business_postal_code: string | null
  business_website: string | null
  business_entity_type: string | null
  business_industry_type: string | null
  years_in_business: string | null
  number_of_employees: string | null
}

export interface BusinessInfoResponse {
  status: boolean
  message: string
  data: BusinessInfoData
}
