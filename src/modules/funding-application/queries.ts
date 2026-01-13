import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import { fetchBusinessInfo } from './services'

export const useBusinessInfo = () => {
  return useQuery({
    queryKey: queryKeys.fundingApplication.businessInfo(),
    queryFn: fetchBusinessInfo,
  })
}
