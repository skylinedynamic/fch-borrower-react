import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { http, HttpResponse } from 'msw'
import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import { server } from '../../mocks/server'
import { createTestQueryClient } from '../../test-utils'
import { queryKeys } from '../../../src/lib/query'
import { useDeleteDocument } from '../../../src/modules/documents'

describe('useDeleteDocument', () => {
  it('refreshes the Getting Started step too: removing the last document can move it back', async () => {
    server.use(
      http.delete('*/borrower/documents/:id', () => HttpResponse.json({ status: true, message: 'deleted', data: null }))
    )
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useDeleteDocument(), { wrapper })
    await act(() => result.current.mutateAsync(7))

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.profile.completion() })
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.documents.list() })
  })
})
