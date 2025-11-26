import { apiClient } from '../../lib/http/apiClient'
import type { PersonalInfoResponse, PersonalInfoData, SavePersonalInfoRequest, SavePersonalInfoResponse } from './types'

export const fetchPersonalInfo = async (): Promise<PersonalInfoData> => {
  const { data } = await apiClient.get<PersonalInfoResponse>('/borrower/profile/personal-info')
  return data.data
}

export const savePersonalInfo = async (payload: SavePersonalInfoRequest): Promise<SavePersonalInfoResponse> => {
  const { data } = await apiClient.post<SavePersonalInfoResponse>('/borrower/profile/personal-info', payload)
  return data
}
