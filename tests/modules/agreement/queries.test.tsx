import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../mocks/server'
import { createTestQueryClient } from '../../test-utils'
import { useCheckAgreementSign } from '../../../src/modules/agreement/queries'

afterEach(() => server.resetHandlers())

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
)

describe('useCheckAgreementSign', () => {
  it('asks whether the borrower must sign', async () => {
    server.use(http.get('*/borrower/agreement-sign/check', () => HttpResponse.json({ status: true, data: { needs_sign: false } })))

    const { result } = renderHook(() => useCheckAgreementSign(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ status: true, data: { needs_sign: false } })
  })

  it('does not ask when told not to (already signed)', async () => {
    let calls = 0
    server.use(http.get('*/borrower/agreement-sign/check', () => { calls += 1; return HttpResponse.json({ status: true, data: {} }) }))

    const { result } = renderHook(() => useCheckAgreementSign(false), { wrapper })

    await new Promise((r) => setTimeout(r, 30))
    expect(result.current.fetchStatus).toBe('idle')
    expect(calls).toBe(0)
  })
})
