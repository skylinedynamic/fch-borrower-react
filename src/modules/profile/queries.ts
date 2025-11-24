import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import { fetchPersonalInfo } from './services'

export const usePersonalInfo = () => {
  return useQuery({
    queryKey: queryKeys.profile.personalInfo(),
    queryFn: fetchPersonalInfo,
  })
}
