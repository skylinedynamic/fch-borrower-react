import { useQuery } from '@tanstack/react-query'
import { fetchPreQualificationRequests, fetchAdvisor, fetchPreQualificationDetail, fetchFundingApplications } from './services'

export const usePreQualificationRequests = (page: number = 1, perPage: number = 5) => {
  return useQuery({
    queryKey: ['pre-qualification-requests', page, perPage],
    queryFn: () => fetchPreQualificationRequests(page, perPage),
    staleTime: 0,
  })
}

export const useAdvisor = () => {
  return useQuery({
    queryKey: ['advisor'],
    queryFn: fetchAdvisor,
  })
}

export const usePreQualificationDetail = (id: number | string) => {
  return useQuery({
    queryKey: ['pre-qualification-detail', id],
    queryFn: () => fetchPreQualificationDetail(id),
    enabled: !!id,
  })
}

export const useFundingApplications = (page: number = 1) => {
  return useQuery({
    queryKey: ['funding-applications', page],
    queryFn: () => fetchFundingApplications(page),
    staleTime: 0,
  })
}
