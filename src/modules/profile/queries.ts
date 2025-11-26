import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import { fetchPersonalInfo, savePersonalInfo } from './services'
import type { SavePersonalInfoRequest } from './types'

export const usePersonalInfo = () => {
  return useQuery({
    queryKey: queryKeys.profile.personalInfo(),
    queryFn: fetchPersonalInfo,
  })
}

export const useSavePersonalInfo = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: SavePersonalInfoRequest) => savePersonalInfo(data),
    onSuccess: () => {
      // Invalidate and refetch personal info after successful save
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.personalInfo() })
    },
  })
}
