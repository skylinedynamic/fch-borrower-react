export type PersonalInfoData = {
  id: number
  first_name: string
  last_name: string
  email: string
  home_address: string
  city: string
  state: string
  zip_code: string
  country: string
  home_phone: string
  phone_number: string
  last_4_ssn: string
  date_of_birth: string
}

export type PersonalInfoResponse = {
  status: boolean
  message: string
  data: PersonalInfoData
}
