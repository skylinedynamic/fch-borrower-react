import { apiClient } from '../../lib/http/apiClient'
import type { BusinessInfoResponse, BusinessInfoData } from './types'

export const fetchBusinessInfo = async (): Promise<BusinessInfoData> => {
  const { data } = await apiClient.get<BusinessInfoResponse>('/borrower/funding-application/business-info')
  return data.data
}
