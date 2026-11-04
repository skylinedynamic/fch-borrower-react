import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { server } from '../../mocks/server'
import { createTestQueryClient } from '../../test-utils'
import { queryKeys } from '../../../src/lib/query/queryKeys'
import {
  useAttestation,
  useBusinessInfo,
  useDisclosuresConsent,
  useFederalCompliance,
  useFinancialInfo,
  useFundingRequest,
  useOwnershipInfo,
} from '../../../src/modules/funding-application/queries'

/**
 * F169: the borrower's edit wizard (/my-applications/funding/{id}/edit) reads
 * every step by the application's own id - one converted from a loan
 * application has no funding request. The id goes in the request and in the
 * cache key, and the read runs even with no funding request to read by.
 */
afterEach(() => server.resetHandlers())

const fa = queryKeys.fundingApplication

const hooks = [
  ['useBusinessInfo', useBusinessInfo, 'business-info', fa.businessInfo()],
  ['useOwnershipInfo', useOwnershipInfo, 'ownership-info', fa.ownershipInfo()],
  ['useFinancialInfo', useFinancialInfo, 'financial-info', fa.financialInfo()],
  ['useDisclosuresConsent', useDisclosuresConsent, 'disclosures-and-consent', fa.disclosuresConsent()],
  ['useFederalCompliance', useFederalCompliance, 'federal-compliance-disclosures', fa.federalCompliance()],
] as const

type ReadHook = (requestId?: number | string | null, options?: { enabled?: boolean; fundingApplicationId?: number | string | null }) => { data?: unknown }

const listen = (step: string) => {
  const seen: URLSearchParams[] = []
  server.use(
    http.get(`*/borrower/funding-application/${step}`, ({ request }) => {
      seen.push(new URL(request.url).searchParams)
      return HttpResponse.json({ status: true, message: 'ok', data: { id: 80 } })
    })
  )
  return seen
}

const render = (useRead: () => { data?: unknown }) => {
  const queryClient = createTestQueryClient()
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  const result = renderHook(useRead, { wrapper })
  return { ...result, queryClient }
}

describe.each(hooks)('%s', (_, hook, step, key) => {
  const useRead = hook as unknown as ReadHook

  it('reads by the application id, even with no funding request, and caches under it', async () => {
    const seen = listen(step)

    const { result, queryClient } = render(() => useRead(null, { enabled: false, fundingApplicationId: 80 }))

    await waitFor(() => expect(result.current.data).toEqual({ id: 80 }))
    expect(seen[0].get('funding_application_id')).toBe('80')
    expect(queryClient.getQueryData([...key, 'current', '80'])).toEqual({ id: 80 })
  })

  it('keeps the funding request read and its cache key as they were', async () => {
    const seen = listen(step)

    const { result, queryClient } = render(() => useRead(29))

    await waitFor(() => expect(result.current.data).toEqual({ id: 80 }))
    expect(seen[0].get('funding_request_id')).toBe('29')
    // Keyed by the id as text, whichever way it arrives, so the wizard reads each step once.
    expect(queryClient.getQueryData([...key, '29'])).toEqual({ id: 80 })
  })

  it('does not read when switched off and there is no application id', () => {
    const seen = listen(step)

    render(() => useRead(29, { enabled: false }))

    expect(seen).toHaveLength(0)
  })
})

describe('useFundingRequest', () => {
  it('reads by the application id and keys the cache by it', async () => {
    const seen = listen('funding-request')

    const { result, queryClient } = render(() => useFundingRequest(null, { fundingApplicationId: 80 }))

    await waitFor(() => expect(result.current.data).toEqual({ id: 80 }))
    expect(seen[0].get('funding_application_id')).toBe('80')
    expect(queryClient.getQueryData([...fa.fundingRequest(), 'current', '80'])).toEqual({ id: 80 })
  })

  it('keys a funding request read by the id as a string, as before', async () => {
    listen('funding-request')

    const { result, queryClient } = render(() => useFundingRequest(5))

    await waitFor(() => expect(result.current.data).toEqual({ id: 80 }))
    expect(queryClient.getQueryData([...fa.fundingRequest(), '5'])).toEqual({ id: 80 })
  })
})

describe('useAttestation', () => {
  it('reads by the application id and keys the cache by it', async () => {
    const seen = listen('attestation-authorization')

    const { result, queryClient } = render(() => useAttestation(null, { fundingApplicationId: 80 }))

    await waitFor(() => expect(result.current.data).toEqual({ id: 80 }))
    expect(seen[0].get('funding_application_id')).toBe('80')
    expect(queryClient.getQueryData(['attestation', 'current', '80'])).toEqual({ id: 80 })
  })
})
