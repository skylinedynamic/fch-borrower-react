import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchActiveFundingRequests, fetchDashboardData } from '../../../src/modules/dashboard/services'

afterEach(() => server.resetHandlers())

describe('fetchDashboardData', () => {
  it('returns the full response envelope', async () => {
    const envelope = { status: true, message: 'ok', data: { credit_score: 720 } }
    server.use(http.get('*/borrower/dashboard', () => HttpResponse.json(envelope)))
    await expect(fetchDashboardData()).resolves.toEqual(envelope)
  })
})

describe('fetchActiveFundingRequests', () => {
  it('reads the approved requests not yet started from their own endpoint', async () => {
    const request = { id: 7, requested_amount: '45000', estimated_funding_range: '$45,000', funding_type: 'Term Loan' }
    const envelope = {
      status: true,
      message: 'ok',
      data: {
        active_approved_funding_requests: [request],
        active_approved_funding_request: request,
        active_approved_funding_request_count: 1,
      },
    }
    server.use(http.get('*/borrower/active-funding-requests', () => HttpResponse.json(envelope)))
    await expect(fetchActiveFundingRequests()).resolves.toEqual(envelope)
  })
})
