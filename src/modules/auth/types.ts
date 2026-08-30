export type Borrower = {
  id: number | string
  name: string
  email?: string
  phone?: string
  status?: string
  [key: string]: unknown
}

export type BorrowerRegistrationPayload = {
  signup_id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  state: string
  password: string
  password_confirmation: string
}