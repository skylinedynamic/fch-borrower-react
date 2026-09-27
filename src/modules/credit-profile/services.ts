import { apiClient } from '../../lib/http/apiClient'
import type { CreditProfile, CreditProfileRequestData } from './types'

interface CreditProfileResponse {
  data: CreditProfile | CreditProfileRequestData | null
  message: string
}

export const fetchCreditProfile = async (): Promise<CreditProfile | CreditProfileRequestData | null> => {
  const res = await apiClient.get<CreditProfileResponse>('/borrower/profile/credit-profile')
  return res.data.data
}
