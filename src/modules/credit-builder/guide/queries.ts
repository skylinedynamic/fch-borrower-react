import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../lib/query'
import { fetchTierTaskList, verifyTierTasks } from './services'

export const useTierTaskList = () => {
  return useQuery({
    queryKey: queryKeys.creditBuilder.tierTaskList(),
    queryFn: fetchTierTaskList,
    select: (response) => response.data,
  })
}

export const useVerifyTierTasks = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: verifyTierTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditBuilder.tierTaskList() })
      // Submitting Tier 0 is a Getting Started step: the walkthrough moves on
      // (and its popup opens) without waiting for a page reload.
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.completion() })
    },
  })
}
