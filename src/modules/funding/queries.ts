import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query/queryKeys'
import { fetchBorrowerFunding } from './services'
import type { FundingOptions, FundingOptionsResponse } from './types'

/** The funding programs matched to the borrower, grouped as the Funding page shows them. */
export const useFundingOptions = (options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: queryKeys.funding.list(),
    queryFn: () => fetchBorrowerFunding() as Promise<FundingOptionsResponse>,
    select: (response): FundingOptions => response.data,
    enabled: options.enabled ?? true,
  })
}
