import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../lib/query'
import { fetchCreditProgress, fetchTaskOverview } from './services'

export const useCreditProgress = () => {
  return useQuery({
    queryKey: queryKeys.creditBuilder.progress(),
    queryFn: fetchCreditProgress,
  })
}

export const useTaskOverview = () => {
  return useQuery({
    queryKey: queryKeys.creditBuilder.taskOverview(),
    queryFn: fetchTaskOverview,
  })
}
