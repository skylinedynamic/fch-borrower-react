import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../mocks/server'
import { createTestQueryClient } from '../../test-utils'
import * as calendly from '../../../src/modules/calendly'

afterEach(() => server.resetHandlers())

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
)

describe('calendly queries (borrower)', () => {
  it('the module index exposes the hooks and services', () => {
    expect(calendly.useCalendlyStatus).toBeTypeOf('function')
    expect(calendly.useCalendlyEventTypes).toBeTypeOf('function')
    expect(calendly.fetchCalendlyStatus).toBeTypeOf('function')
  })

  it('useCalendlyStatus reads the status - own Calendly, or booking with the partner\'s', async () => {
    server.use(http.get('*/common/calendly/status', () =>
      HttpResponse.json({ status: true, data: { connected: false, books_with_partner: true, can_sync: true } })))

    const { result } = renderHook(() => calendly.useCalendlyStatus(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ connected: false, books_with_partner: true, can_sync: true })
  })

  it('useCalendlyEventTypes lists them, and asks nothing while disabled', async () => {
    let calls = 0
    server.use(http.get('*/common/calendly/event-types', () => {
      calls += 1
      return HttpResponse.json({ status: true, data: [{ uri: 'u1', name: '30 Minute Meeting', duration: 30 }] })
    }))

    const off = renderHook(() => calendly.useCalendlyEventTypes(false), { wrapper })
    expect(off.result.current.fetchStatus).toBe('idle')
    expect(calls).toBe(0)

    const { result } = renderHook(() => calendly.useCalendlyEventTypes(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ uri: 'u1', name: '30 Minute Meeting', duration: 30 }])
    expect(calls).toBe(1)
  })

  it('useCalendlyAvailableTimes asks only once an event type and a day are chosen, and does not retry', async () => {
    let calls = 0
    server.use(http.post('*/common/calendly/available-times', () => {
      calls += 1
      return HttpResponse.json({ status: false, message: 'Expired' }, { status: 422 })
    }))

    for (const payload of [null, { event_type_uri: '', date: '2026-11-20', timezone: 'UTC' }, { event_type_uri: 'u1', date: '', timezone: 'UTC' }]) {
      const { result } = renderHook(() => calendly.useCalendlyAvailableTimes(payload), { wrapper })
      expect(result.current.fetchStatus).toBe('idle')
    }
    expect(calls).toBe(0)

    const { result } = renderHook(() => calendly.useCalendlyAvailableTimes({ event_type_uri: 'u1', date: '2026-11-20', timezone: 'UTC' }), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(calls).toBe(1)
  })

  it('useCalendlyAvailableTimes returns the open slots', async () => {
    server.use(http.post('*/common/calendly/available-times', () =>
      HttpResponse.json({ status: true, data: [{ start_time: '2026-11-20T15:00:00Z', label: '3:00 PM' }] })))

    const { result } = renderHook(() => calendly.useCalendlyAvailableTimes({ event_type_uri: 'u1', date: '2026-11-20', timezone: 'UTC' }), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ start_time: '2026-11-20T15:00:00Z', label: '3:00 PM' }])
  })
})
