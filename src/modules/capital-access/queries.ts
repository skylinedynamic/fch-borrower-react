import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query/queryKeys'
import { fetchCapitalAccessStrategies, fetchCapitalAccessStrategyDetail, fetchCapitalAccessOverview, fetchCapitalAccessStrategyOverview, fetchCapitalAccessStrategyChecklist, fetchCapitalAccessStrategyRoadmap, fetchCapitalAccessStepDetail, submitCapitalAccessStepDetail, startCapitalAccessPlay } from './services'

export const useCapitalAccessOverview = (options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: queryKeys.capitalAccess.overview(),
    queryFn: fetchCapitalAccessOverview,
    enabled: options.enabled ?? true,
  })
}

export const useCapitalAccessStrategies = (options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: queryKeys.capitalAccess.strategies(),
    queryFn: fetchCapitalAccessStrategies,
    enabled: options.enabled ?? true,
  })
}

export const useCapitalAccessStrategy = (id: string | number | undefined) => {
  return useQuery({
    queryKey: queryKeys.capitalAccess.detail(id || 0),
    queryFn: () => fetchCapitalAccessStrategyDetail(id || 0),
    enabled: !!id,
  })
}

export const useCapitalAccessStrategyOverview = (id: string | number | undefined) => {
  return useQuery({
    queryKey: queryKeys.capitalAccess.detailOverview(id || 0),
    queryFn: () => fetchCapitalAccessStrategyOverview(id || 0),
    enabled: !!id,
  })
}

export const useCapitalAccessStrategyChecklist = (id: string | number | undefined) => {
  return useQuery({
    queryKey: queryKeys.capitalAccess.detailChecklist(id || 0),
    queryFn: () => fetchCapitalAccessStrategyChecklist(id || 0),
    enabled: !!id,
  })
}

export const useCapitalAccessStrategyRoadmap = (id: string | number | undefined) => {
  return useQuery({
    queryKey: queryKeys.capitalAccess.detailRoadmap(id || 0),
    queryFn: () => fetchCapitalAccessStrategyRoadmap(id || 0),
    enabled: !!id,
  })
}

export const useCapitalAccessStepDetail = (
  strategyId: string | number | undefined,
  sequenceId: string | number | undefined
) => {
  return useQuery({
    queryKey: queryKeys.capitalAccess.detailStep(strategyId || 0, sequenceId || 0),
    queryFn: () => fetchCapitalAccessStepDetail(strategyId || 0, sequenceId || 0),
    enabled: !!strategyId && !!sequenceId,
  })
}

export const useSubmitCapitalAccessStep = (
  strategyId: string | number | undefined,
  sequenceId: string | number | undefined
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { credit_limit?: number | string | null; notes?: string | null; status?: string }) =>
      submitCapitalAccessStepDetail(strategyId || 0, sequenceId || 0, payload),
    onSuccess: () => {
      // Refresh the submitted step detail
      queryClient.invalidateQueries({ queryKey: queryKeys.capitalAccess.detailStep(strategyId || 0, sequenceId || 0) })
      // Refresh roadmap so step status badges update
      queryClient.invalidateQueries({ queryKey: queryKeys.capitalAccess.detailRoadmap(strategyId || 0) })
      // Refresh strategies list so isCompleted updates (drives StrategySelection & StepDetail access logic)
      queryClient.invalidateQueries({ queryKey: queryKeys.capitalAccess.strategies() })
      // Refresh overview so current_play & dashboard status update
      queryClient.invalidateQueries({ queryKey: queryKeys.capitalAccess.overview() })
    },
  })
}

export const useStartCapitalAccessPlay = (strategyId: string | number | undefined) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => startCapitalAccessPlay(strategyId || 0),
    onSuccess: () => {
      // Invalidate queries so selecting strategy updates the dashboard & general status
      queryClient.invalidateQueries({ queryKey: queryKeys.capitalAccess.strategies() })
      queryClient.invalidateQueries({ queryKey: queryKeys.capitalAccess.overview() })
    },
  })
}

