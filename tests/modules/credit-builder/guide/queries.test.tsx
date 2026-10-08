import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { http, HttpResponse } from 'msw'
import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import { server } from '../../../mocks/server'
import { createTestQueryClient } from '../../../test-utils'
import { queryKeys } from '../../../../src/lib/query'
import { useVerifyTierTasks } from '../../../../src/modules/credit-builder/guide/queries'

describe('useVerifyTierTasks', () => {
  it('refreshes the Getting Started step too: submitting Tier 0 moves the walkthrough on', async () => {
    server.use(
      http.post('*/borrower/credit-builder/task-verify-request', () =>
        HttpResponse.json({ success: true, message: 'submitted', data: null })
      )
    )
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useVerifyTierTasks(), { wrapper })
    await act(() => result.current.mutateAsync({ task_ids: [1, 2], tier_id: 1 }))

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.profile.completion() }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.creditBuilder.tierTaskList() })
  })
})
