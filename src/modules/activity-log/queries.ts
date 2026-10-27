import { useQuery } from '@tanstack/react-query'
import { getBorrowerActivityLogs } from './services'
import type { ActivityLog, ActivityLogParams } from './types'

/** A borrower's activity for one funding application, request or prequalification. */
export const useBorrowerActivityLogs = (params: ActivityLogParams) =>
  useQuery({
    queryKey: ['borrower-activity-logs', params],
    queryFn: async (): Promise<ActivityLog[]> => (await getBorrowerActivityLogs(params)).data || [],
    enabled: !!(params.funding_application_id || params.funding_request_id || params.pre_qualification_id),
  })
