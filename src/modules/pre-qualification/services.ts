import { apiClient } from '../../lib/http/apiClient'
import type { PreQualificationResponse, PreQualificationData } from './types'

export const fetchPreQualification = async (): Promise<PreQualificationData> => {
  const { data } = await apiClient.get<PreQualificationResponse>('/borrower/pre-qualification')
  return data.data
}
