import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../lib/query'
import { fetchCreditProgress } from './services'

export const useCreditProgress = () => {
  return useQuery({
    queryKey: queryKeys.creditBuilder.progress(),
    queryFn: fetchCreditProgress,
  })
}
