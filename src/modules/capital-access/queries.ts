import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../lib/query/queryKeys'
import { fetchCapitalAccessStrategies, fetchCapitalAccessStrategyDetail } from './services'

export const useCapitalAccessStrategies = () => {
  return useQuery({
    queryKey: queryKeys.capitalAccess.strategies(),
    queryFn: fetchCapitalAccessStrategies,
  })
}

export const useCapitalAccessStrategy = (id: string | number | undefined) => {
  return useQuery({
    queryKey: queryKeys.capitalAccess.detail(id || 0),
    queryFn: () => fetchCapitalAccessStrategyDetail(id || 0),
    enabled: !!id,
  })
}
