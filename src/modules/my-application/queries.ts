import { useQuery } from '@tanstack/react-query'
import { fetchPreQualificationRequests, fetchAdvisor } from './services'

export const usePreQualificationRequests = (page: number = 1) => {
  return useQuery({
    queryKey: ['pre-qualification-requests', page],
    queryFn: () => fetchPreQualificationRequests(page),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAdvisor = () => {
  return useQuery({
    queryKey: ['advisor'],
    queryFn: fetchAdvisor,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}
