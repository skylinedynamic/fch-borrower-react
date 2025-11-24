import { apiClient } from '../../lib/http/apiClient'
import type { PersonalInfoResponse, PersonalInfoData } from './types'

export const fetchPersonalInfo = async (): Promise<PersonalInfoData> => {
  const { data } = await apiClient.get<PersonalInfoResponse>('/borrower/profile/personal-info')
  return data.data
}
