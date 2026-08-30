import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../mocks/server'
import { createTestQueryClient } from '../../test-utils'
import { usePreQualification, useSubmitFundingInfo } from '../../../src/modules/pre-qualification/queries'
import { queryKeys } from '../../../src/lib/query/queryKeys'

afterEach(() => server.resetHandlers())

describe('usePreQualification', () => {
  it('fetches and unwraps the pre-qualification data', async () => {
    server.use(
      http.get('*/borrower/pre-qualification', () =>
        HttpResponse.json({ status: true, message: 'ok', data: { id: 1, current_step: 'personal-info' } })
      )
    )
    const queryClient = createTestQueryClient()
    const { result } = renderHook(() => usePreQualification(), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ id: 1, current_step: 'personal-info' })
  })
})

describe('useSubmitFundingInfo', () => {
  it('posts the payload and invalidates the pre-qualification cache on success', async () => {
    let receivedBody: unknown = null
    server.use(
      http.post('*/borrower/pre-qualification/funding-info', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ status: true, message: 'ok', data: { id: 1, current_step: 'review' } })
      })
    )
    const queryClient = createTestQueryClient()
    const invalidated: unknown[][] = []
    queryClient.invalidateQueries = ((opts: any) => {
      invalidated.push(opts.queryKey)
      return Promise.resolve()
    }) as typeof queryClient.invalidateQueries

    const { result } = renderHook(() => useSubmitFundingInfo(), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })

    result.current.mutate({ requested_amount: '10000' } as any)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivedBody).toEqual({ requested_amount: '10000' })
    expect(invalidated).toContainEqual(queryKeys.preQualification.all)
  })
})
