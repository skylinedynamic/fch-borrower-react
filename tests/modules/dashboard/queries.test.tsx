import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { server } from '../../mocks/server'
import { createTestQueryClient } from '../../test-utils'
import { useDashboard } from '../../../src/modules/dashboard'

afterEach(() => server.resetHandlers())

describe('useDashboard', () => {
  it('re-checks every time the dashboard is opened, so new meetings and invoices show up', async () => {
    // Meetings are added from the Appointments page, or by the borrower's
    // account manager, and neither tells this cache. A five minute freshness
    // window therefore showed "No Upcoming Meetings" for a meeting that existed.
    let requests = 0
    server.use(
      http.get('*/borrower/dashboard', () => {
        requests++
        return HttpResponse.json({ status: true, data: { upcoming_meeting: requests > 1 ? [{ id: 1 }] : [] } })
      })
    )
    const queryClient = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const first = renderHook(() => useDashboard(), { wrapper })
    await waitFor(() => expect(first.result.current.data?.data.upcoming_meeting).toEqual([]))
    first.unmount()

    // Back on the dashboard moments later.
    const second = renderHook(() => useDashboard(), { wrapper })

    await waitFor(() => expect(requests).toBe(2))
    await waitFor(() => expect(second.result.current.data?.data.upcoming_meeting).toHaveLength(1))
  })
})
