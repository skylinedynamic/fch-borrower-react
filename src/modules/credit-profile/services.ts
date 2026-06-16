import { apiClient } from '../../lib/http/apiClient'
import type { CreditProfile } from './types'

interface CreditProfileResponse {
  data: CreditProfile | null
  message: string
}

export const fetchCreditProfile = async (): Promise<CreditProfile | null> => {
  const res = await apiClient.get<CreditProfileResponse>('/borrower/profile/credit-profile')
  return res.data.data
}
