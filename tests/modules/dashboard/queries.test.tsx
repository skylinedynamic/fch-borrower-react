import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { server } from '../../mocks/server'
import { createTestQueryClient } from '../../test-utils'
import { useActiveFundingRequests } from '../../../src/modules/dashboard'

const request = { id: 7, requested_amount: '45000', estimated_funding_range: '$45,000', funding_type: 'Term Loan' }

const activeResponse = (count: number) => ({
  status: true,
  message: 'ok',
  data: {
    active_approved_funding_requests: count ? [request] : [],
    active_approved_funding_request: count ? request : null,
    active_approved_funding_request_count: count,
  },
})

const wrapperFor = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

describe('useActiveFundingRequests', () => {
  it('loads the active requests without loading the dashboard', async () => {
    let dashboardCalls = 0
    server.use(
      http.get('*/borrower/dashboard', () => {
        dashboardCalls += 1
        return HttpResponse.json({ status: true, data: {} })
      }),
      http.get('*/borrower/active-funding-requests', () => HttpResponse.json(activeResponse(1)))
    )

    const { result } = renderHook(() => useActiveFundingRequests(), { wrapper: wrapperFor(createTestQueryClient()) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data.active_approved_funding_request_count).toBe(1)
    expect(result.current.data?.data.active_approved_funding_request?.id).toBe(7)
    expect(dashboardCalls).toBe(0)
  })

  it('refreshes whenever the dashboard is invalidated (a funding application started or changed)', async () => {
    let count = 1
    server.use(http.get('*/borrower/active-funding-requests', () => HttpResponse.json(activeResponse(count))))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useActiveFundingRequests(), { wrapper: wrapperFor(queryClient) })
    await waitFor(() => expect(result.current.data?.data.active_approved_funding_request_count).toBe(1))

    // What the funding-application mutations already do on success.
    count = 0
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })

    await waitFor(() => expect(result.current.data?.data.active_approved_funding_request_count).toBe(0))
  })
})
