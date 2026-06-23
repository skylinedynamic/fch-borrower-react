import { apiClient } from '../../lib/http/apiClient'
import type { StrategiesResponse, StrategyDetailResponse, CapitalAccessStrategy, CapitalAccessOverview, OverviewResponse, CapitalAccessStrategyOverview, CapitalAccessStrategyChecklist, CapitalAccessStrategyRoadmap, CapitalAccessStepDetail } from './types'
 
const mapChecklist = (checklist: any[]): Array<{ id: string; label: string; complete: boolean }> => {
  if (!checklist) return []
  return checklist.map((item, index) => {
    if (typeof item === 'string') {
      return { id: `item-${index}`, label: item, complete: true }
    }
    return {
      id: item.id || `item-${index}`,
      label: item.label || item.name || '',
      complete: item.complete !== false,
    }
  })
}

const mapStrategy = (data: any): CapitalAccessStrategy => {
  return {
    ...data,
    checklist: mapChecklist(data.checklist),
    roadmap: data.roadmap || [],
  }
}

const mapStrategyOverview = (data: any): CapitalAccessStrategyOverview => {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    isRecommended: !!data.isRecommended,
    target_exposure: data.target_exposure,
    est_timeline: data.est_timeline,
    approval_probability: data.approval_probability,
    approval_status: !!data.approval_status,
    reason_code: data.reason_code || null,
    benefits: data.benefits || [],
  }
}

const mapStrategyChecklist = (data: any): CapitalAccessStrategyChecklist => {
  return {
    id: data.id,
    name: data.name,
    approval_status: !!data.approval_status,
    reason_code: data.reason_code || null,
    checklist: mapChecklist(data.checklist),
  }
}

export const fetchCapitalAccessStrategies = async (): Promise<CapitalAccessStrategy[]> => {
  const { data } = await apiClient.get<StrategiesResponse>('/borrower/capital-access/strategies-list')
  return (data.data || []).map(mapStrategy)
}

export const fetchCapitalAccessStrategyDetail = async (id: string | number): Promise<CapitalAccessStrategy> => {
  const { data } = await apiClient.get<StrategyDetailResponse>(`/borrower/capital-access/strategies/${id}`)
  return mapStrategy(data.data)
}

export const fetchCapitalAccessStrategyOverview = async (id: string | number): Promise<CapitalAccessStrategyOverview> => {
  const { data } = await apiClient.get<StrategyDetailResponse>(`/borrower/capital-access/strategies/${id}/overview`)
  return mapStrategyOverview(data.data)
}

export const fetchCapitalAccessStrategyChecklist = async (id: string | number): Promise<CapitalAccessStrategyChecklist> => {
  const { data } = await apiClient.get<StrategyDetailResponse>(`/borrower/capital-access/strategies/${id}/checklist`)
  return mapStrategyChecklist(data.data)
}

export const fetchCapitalAccessOverview = async (): Promise<CapitalAccessOverview> => {
  const { data } = await apiClient.get<OverviewResponse>('/borrower/capital-access/overview')
  return data.data
}

export const fetchCapitalAccessStrategyRoadmap = async (id: string | number): Promise<CapitalAccessStrategyRoadmap> => {
  const { data } = await apiClient.get<StrategyDetailResponse>(`/borrower/capital-access/strategies/${id}/roadmap`)
  const raw = data.data
  return {
    id: raw.id,
    name: raw.name,
    approval_status: raw.approval_status,
    reason_code: raw.reason_code ?? null,
    target_exposure: raw.target_exposure ?? '',
    est_timeline: raw.est_timeline ?? '',
    roadmap: Array.isArray(raw.roadmap) ? raw.roadmap : [],
  }
}

export const fetchCapitalAccessStepDetail = async (
  strategyId: string | number,
  sequenceId: string | number
): Promise<CapitalAccessStepDetail> => {
  const { data } = await apiClient.get<StrategyDetailResponse>(
    `/borrower/capital-access/strategies/${strategyId}/step/${sequenceId}`
  )
  return data.data
}

export const submitCapitalAccessStepDetail = async (
  strategyId: string | number,
  sequenceId: string | number,
  payload: { credit_limit?: number | string | null; notes?: string | null; status?: string }
): Promise<any> => {
  const { data } = await apiClient.post(
    `/borrower/capital-access/strategies/${strategyId}/step/${sequenceId}/submit`,
    payload
  )
  return data.data
}

