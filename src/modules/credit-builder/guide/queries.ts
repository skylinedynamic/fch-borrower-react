import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../lib/query'
import { fetchTierTaskList } from './services'

export const useTierTaskList = () => {
  return useQuery({
    queryKey: queryKeys.creditBuilder.tierTaskList(),
    queryFn: fetchTierTaskList,
    select: (response) => response.data,
  })
}
