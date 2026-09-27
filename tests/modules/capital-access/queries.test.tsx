import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../mocks/server'
import { createTestQueryClient } from '../../test-utils'
import {
  useCapitalAccessStrategy,
  useSubmitCapitalAccessStep,
} from '../../../src/modules/capital-access/queries'
import { queryKeys } from '../../../src/lib/query/queryKeys'

afterEach(() => server.resetHandlers())

describe('useCapitalAccessStrategy', () => {
  it('does not fetch when no id is provided', () => {
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useCapitalAccessStrategy(undefined), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('fetches and returns the mapped strategy once an id is provided', async () => {
    server.use(
      http.get('*/borrower/capital-access/strategies/9', () =>
        HttpResponse.json({ status: true, message: 'ok', data: { id: 9, name: 'Play D', checklist: [] } })
      )
    )
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => useCapitalAccessStrategy(9), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Play D')
  })
})

describe('useSubmitCapitalAccessStep', () => {
  it('invalidates the step detail, roadmap, strategies, and overview caches on success', async () => {
    server.use(
      http.post('*/borrower/capital-access/strategies/1/step/2/submit', () =>
        HttpResponse.json({ status: true, message: 'ok', data: { id: 1 } })
      )
    )
    const queryClient = createTestQueryClient()
    const invalidated: unknown[][] = []
    const originalInvalidate = queryClient.invalidateQueries.bind(queryClient)
    queryClient.invalidateQueries = (opts: any) => {
      invalidated.push(opts.queryKey)
      return originalInvalidate(opts)
    }

    const { result } = renderHook(() => useSubmitCapitalAccessStep(1, 2), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })

    result.current.mutate({ credit_limit: 5000 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidated).toContainEqual(queryKeys.capitalAccess.detailStep(1, 2))
    expect(invalidated).toContainEqual(queryKeys.capitalAccess.detailRoadmap(1))
    expect(invalidated).toContainEqual(queryKeys.capitalAccess.strategies())
    expect(invalidated).toContainEqual(queryKeys.capitalAccess.overview())
  })
})
