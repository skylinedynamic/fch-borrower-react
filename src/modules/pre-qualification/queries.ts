import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import { fetchPreQualification } from './services'

export const usePreQualification = () => {
  return useQuery({
    queryKey: queryKeys.preQualification.all,
    queryFn: fetchPreQualification,
  })
}
