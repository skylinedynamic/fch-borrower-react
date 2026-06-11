import { apiClient } from '../../../lib/http/apiClient'
import type { StrategiesResponse, StrategyDetailResponse, CapitalAccessStrategy } from './types'

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

export const fetchCapitalAccessStrategies = async (): Promise<CapitalAccessStrategy[]> => {
  const { data } = await apiClient.get<StrategiesResponse>('/borrower/credit-builder/capital-access/strategies')
  return (data.data || []).map(mapStrategy)
}

export const fetchCapitalAccessStrategyDetail = async (id: string | number): Promise<CapitalAccessStrategy> => {
  const { data } = await apiClient.get<StrategyDetailResponse>(`/borrower/credit-builder/capital-access/strategies/${id}`)
  return mapStrategy(data.data)
}
